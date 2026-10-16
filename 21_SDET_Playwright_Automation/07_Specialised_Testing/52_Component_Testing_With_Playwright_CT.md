# 52. Component Testing with Playwright — Stories & Galleries (1.62+) and the Legacy `experimental-ct-*` — The Bridge to Dev

**Navigation**: [← 51. Secrets Management](../06_CI_CD_And_Reliability/51_Secrets_Management_For_SDETs.md) | [Index](../00_INDEX.md) | [→ 53. Mutation Testing](../07_Specialised_Testing/53_Mutation_Testing_With_Stryker.md)

---

## 5W1H

- **WHAT**: Render a single UI component (React, Vue, anything your dev server can build) in a real browser and assert against it — no full app, no API, no router.
- **WHY**: E2E tests are slow and over-scoped for "does this button emit the right event." Component tests catch UI bugs at unit-test speed.
- **WHO**: SDETs working closely with frontend devs, or SDETs preparing to shift into FE work.
- **WHEN**: When you have isolated UI components with non-trivial behaviour (forms, dialogs, complex inputs) that are expensive to exercise through full E2E.
- **HOW**: **Since Playwright 1.62** the built-in `mount('story-id')` fixture of `@playwright/test` opens a small *gallery* page served by your own dev server and renders a *story* (a wrapper component for one scenario). Before that, `@playwright/experimental-ct-react` / `-vue` bundled JSX from the test with their own Vite — those packages are frozen at 1.62.1 (section 2).

---

## 0. War Stories — Component Testing Traps

### Story 1: Context provider mocking that masked a real bug

A payment form component was tested in isolation. The component used a `usePaymentContext()` hook. In the CT test, the tester mocked the context:

```typescript
// test/PaymentForm.ct.spec.tsx (legacy flow)
await mount(<PaymentContext.Provider value={{ currency: 'USD', taxRate: 0.08 }}>
  <PaymentForm />
</PaymentContext.Provider>);
```

The mock returned a static `taxRate: 0.08`. The component rendered, calculated totals correctly, tests passed.

In production: the `usePaymentContext()` hook fetched `taxRate` from a remote config service. When that service was slow (> 500ms), the hook returned `undefined`. The component divided by `undefined`, rendered `NaN`, and showed `$NaN` as the order total.

The CT test never reproduced this because the mock provided an instant, complete value with no loading state.

**What the test should have included** (legacy-flow syntax, as the original author would write it; the current-model version is in section 3.7):
```typescript
// Also test the loading state — the context that matches production reality
const component = await mount(
  <PaymentContext.Provider value={{ currency: 'USD', taxRate: undefined }}>
    <PaymentForm />
  </PaymentContext.Provider>,
);
await expect(component.getByText('Loading tax rate...')).toBeVisible();
// NOT NaN, NOT $0.00 — should show a loading placeholder
```

**Lesson:** When mocking a context provider, always test the loading/undefined state. That's usually the production state during the first render. Static mock values test the happy path only.

### Story 2: The CT suite that only ran locally — Vite config not in CI

A team wrote 40 component tests using `@playwright/experimental-ct-react` (the pre-1.62 flow). Every developer ran them locally. The CT suite never ran in CI — the `package.json` had `test:ct` but the CI workflow only ran `test:e2e`.

An engineer refactored the shared `<DataTable>` component for performance, removing the `aria-label` prop from every cell. 40 CT tests would have caught it immediately. E2E tests didn't cover the component in isolation, so the label removal went undetected for 3 weeks.

An accessibility audit then flagged 200 table cells with missing labels across the app.

**Fix pattern for CI:**
```yaml
# .github/workflows/ci.yml — add CT as a separate parallel job
ct-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm ci && npx playwright install --with-deps chromium
    - run: npm run test:ct
```

**Lesson:** CT tests only protect against regressions if they run in CI. A local-only CT suite is documentation, not a gate.

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

## 2. Version Status — Read This First

Playwright replaced its component-testing model in **1.62** and then stopped shipping the old packages. Everything in this chapter is tagged as **current** (stories + gallery, built into `@playwright/test`) or **legacy** (`@playwright/experimental-ct-*`). Verified 2026-10-16 against the npm registry, the release notes and the docs source at the `v1.62.0` – `v1.64.1` tags, and by running both models.

| Date | Version | What changed for component testing |
| ---- | ------- | ---------------------------------- |
| 2026-01-23 | 1.58 | Last release with `@playwright/experimental-ct-svelte` (final build `1.58.2`, 2026-02-06). |
| 2026-04-01 | 1.59 | Release notes: "Removed `@playwright/experimental-ct-svelte` package". |
| 2026-07-24 | **1.62.0** | **New model introduced**: the `mount(storyId, props?)` fixture is built into `@playwright/test`. The old `-ct-react`, `-ct-react17`, `-ct-vue` packages still published in lockstep (`1.62.0`, then `1.62.1` on 2026-07-30). |
| 2026-09-04 | **1.63.0** | Release notes: the three `-ct-*` packages "will no longer be updated"; the docs now say they were removed and are no longer published. `mount()` story ids become typeable through the generated `Stories` registry. **No `1.63.x`/`1.64.x` of any `-ct-*` package exists on npm.** |
| 2026-10-07 / 10-14 | 1.64.0 / 1.64.1 | No component-testing change. `1.64.1` is the current `latest` of `@playwright/test`. |

Older, already-dead packages: `-ct-vue2` and `-ct-solid` stopped at the 1.49 line (last `latest` is `1.48.2`).

### What actually works on 1.64.1 (observed)

| Attempt | Result |
| ------- | ------ |
| `npm i -D @playwright/experimental-ct-react@1.64.1` | `E404 No match found for version 1.64.1`. |
| `@playwright/test@1.64.1` **plus** `@playwright/experimental-ct-react@1.62.1`, run with `npx playwright test -c playwright-ct.config.ts` | Works, **but silently on 1.62.1**: the CT package depends on its own copy of `playwright@1.62.1`, npm hoists it to `node_modules/playwright`, and `npx playwright --version` prints `1.62.1`. `npm ls playwright` shows two copies. |
| The same project run with the 1.64.1 runner (`node node_modules/@playwright/test/cli.js test -c playwright-ct.config.ts`) | Fails: `Playwright Test did not expect test() to be called here ... You have two different versions of @playwright/test`. The spec's `test` comes from 1.62.1, the runner is 1.64.1. |
| `@playwright/test@1.64.1` with the new gallery model | Works; no extra packages. |

**Conclusion.** The legacy packages are frozen at 1.62.1. You can keep a legacy suite alive only by pinning *both* packages to `1.62.1` (the docs say the same: "stay on Playwright 1.62 until you have followed the migration guide"). You cannot upgrade the runner past 1.62 and keep them. Every other part of the module — E2E, API, fixtures, traces — is unaffected; only `mount`-style component tests are.

---

## 3. The Current Model: Stories and a Gallery (Playwright 1.62+)

### 3.1 Three pieces

- A **story** is a small component that embeds the component under test in one scenario: hard-coded props, mock data, providers, and callbacks that record what happened. It lives next to the component in `*.story.tsx`; each named export is one story.
- The **gallery** is one HTML page, served by *your* dev server, that defines `window.mount({ story, props })` and `window.unmount()`. It finds the story by id, renders it into `#root`, and returns a promise that **rejects** on an unknown story or a render error. It is application code that you own; Playwright ships no gallery.
- The **`mount` fixture** (built into `@playwright/test`) glues them together. Read from the shipped runtime in `node_modules/playwright/lib/index.js` (1.64.1), abridged, it does this:

```js
await page.goto(baseURL);                       // every mount() is a fresh navigation
await page.evaluate(
  async (p) => { await window.mount(p); },      // p = { story: storyId, props }
  { story: storyId, props },
  { exposeFunctions: true },                    // function values inside props are proxied back to Node
);
return Object.assign(page.locator('#root'), {   // the returned Locator is #root, plus:
  update: (newProps) => /* same evaluate, no goto */,
  unmount: () => page.evaluate(() => window.unmount?.()),
});
```

So a component test is an ordinary Playwright test against an ordinary page. `webServer`, `page.route`, traces, retries, sharding and `toHaveScreenshot` all work unchanged because nothing component-specific sits underneath.

### 3.2 A runnable React + Vite example

Verified on `@playwright/test@1.64.1`, `vite@8.3.4`, `@vitejs/plugin-react@6.1.2`, React 19, TypeScript 7.0.2 under `strict` + `noUncheckedIndexedAccess` + `noUnusedLocals` + `noUnusedParameters` + `noImplicitReturns` (clean), Chromium 156. Layout:

```
vite.config.ts
playwright.config.ts
playwright/gallery/index.html
playwright/gallery/main.tsx
src/components/Counter.tsx
src/components/Counter.story.tsx
tests/components/counter.spec.ts
```

```bash
npm i -D @playwright/test@1.64.1 vite @vitejs/plugin-react react react-dom @types/react @types/react-dom typescript @types/node
npx playwright install chromium
```

```typescript
// vite.config.ts — your normal app config; the gallery is just another HTML file under the project root
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { port: 5173, strictPort: true } });
```

```typescript
// playwright.config.ts — plain defineConfig from @playwright/test; no ctPort, no ctViteConfig
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'components',
      testDir: './tests/components',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5173/playwright/gallery/index.html', // mount() navigates HERE
        serviceWorkers: 'block',   // the app's service worker must not shadow page.route() mocks
        reuseContext: true,        // reuse the browser context across tests in a worker
      },
    },
  ],
  webServer: {
    command: 'npx vite',           // or your app's `npm run dev`
    url: 'http://localhost:5173/playwright/gallery/index.html',
    reuseExistingServer: !process.env.CI,
  },
});
```

```html
<!-- playwright/gallery/index.html -->
<!DOCTYPE html>
<div id="root"></div>
<script type="module" src="./main.tsx"></script>
```

```tsx
// playwright/gallery/main.tsx — the only framework-specific glue (the contract is in the skill's gallery-spec.md)
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';

const stories = import.meta.glob('../../src/**/*.story.{tsx,jsx}');
const id = (f: string) => f.replace(/^(\.\.\/)+src\//, '').replace(/\.story\.\w+$/, '');

async function resolve(storyId: string) {
  const sep = storyId.lastIndexOf('/');
  const [path, name] = [storyId.slice(0, sep), storyId.slice(sep + 1)];
  const file = Object.keys(stories).find((f) => id(f) === path || id(f).endsWith('/' + path));
  const mod = (file && (await stories[file]!())) as Record<string, any> | undefined;
  return mod?.[name] ?? mod?.default;
}

const rootEl = document.getElementById('root')!;
let root: Root | undefined;

(window as any).mount = async ({ story, props }: { story: string; props?: Record<string, any> }) => {
  const Story = await resolve(story);
  if (!Story) throw new Error(`Unknown story: ${story}`);   // becomes the test's mount() rejection
  root ??= createRoot(rootEl);                               // reuse the root so update() keeps state
  flushSync(() => root!.render(<Story {...props} />));       // flushSync: a render error rejects instead of being swallowed
};

(window as any).unmount = async () => {
  root?.unmount();
  root = undefined;
};
```

Put `"types": ["node", "vite/client"]` in `tsconfig.json` so `import.meta.glob` type-checks. Playwright's `init-skills` (below) can write this file for you.

```tsx
// src/components/Counter.tsx
import { useState } from 'react';

export type CounterProps = { start?: number; label?: string; onChange?: (n: number) => void };

export function Counter({ start = 0, label = 'Count', onChange }: CounterProps) {
  const [n, setN] = useState(start);
  return (
    <div>
      <span>{label}: </span><output data-testid="n">{n}</output>
      <button onClick={() => { setN(n + 1); onChange?.(n + 1); }}>Increment</button>
    </div>
  );
}
```

```tsx
// src/components/Counter.story.tsx — id = path under src/ without .story.* + export name
import { useState } from 'react';
import { Counter, type CounterProps } from './Counter';

// components/Counter/Default : plain story, props come from the test (serialisable data only)
export const Default = (props: CounterProps) => <Counter {...props} />;

// components/Counter/Recorded : the STORY owns the callback and records the effect into the DOM
export const Recorded = () => {
  const [last, setLast] = useState<number | null>(null);
  const [calls, setCalls] = useState(0);
  return (
    <>
      <Counter start={5} onChange={(n) => { setLast(n); setCalls((c) => c + 1); }} />
      <form hidden>
        <input data-testid="last" readOnly value={String(last)} />
        <input data-testid="calls" readOnly value={String(calls)} />
      </form>
    </>
  );
};
```

```typescript
// tests/components/counter.spec.ts — note: .ts, no JSX anywhere in the test
import { test, expect } from '@playwright/test';
import type { Default } from '../../src/components/Counter.story'; // `import type`: erased, so Node never loads React

test('renders with per-test props', async ({ mount }) => {
  const c = await mount<typeof Default>('components/Counter/Default', { start: 3, label: 'Clicks' });
  await expect(c.getByTestId('n')).toHaveText('3');
  await expect(c).toContainText('Clicks');
});

test('story records callback effects', async ({ mount }) => {
  const c = await mount('components/Counter/Recorded');
  await c.getByRole('button', { name: 'Increment' }).click();
  await c.getByRole('button', { name: 'Increment' }).click();
  await expect(c.getByTestId('last')).toHaveValue('7');   // web-first: retries until the state lands
  await expect(c.getByTestId('calls')).toHaveValue('2');
});

test('update() preserves state; unmount() empties root', async ({ mount }) => {
  const c = await mount<typeof Default>('Counter/Default', { start: 1 }); // any unique suffix of the id works
  await c.getByRole('button').click();
  await expect(c.getByTestId('n')).toHaveText('2');
  await c.update({ start: 99, label: 'Renamed' });        // same story, new props, NO navigation
  await expect(c).toContainText('Renamed');
  await expect(c.getByTestId('n')).toHaveText('2');       // useState ignored the new initial value: the instance survived
  await c.unmount();
  await expect(c.getByTestId('n')).toHaveCount(0);
});

test('unknown story rejects with a real error', async ({ mount }) => {
  await expect(mount('Nope/Missing')).rejects.toThrow(/Unknown story: Nope\/Missing/);
});
```

```bash
npx playwright test --project=components     # 4 passed
```

**Faster setup.** `npx playwright init-skills` installs three agent skills (`playwright-cli`, `playwright-component-testing`, `playwright-trace`) under `.claude/skills/`. The docs' setup path is to ask your coding agent, "Set up component testing using the playwright-component-testing skill." The skill carries the gallery contract (`references/gallery-spec.md`), React/Vue notes, typing and migration guides — the example above is the contract's worked React example, compiled and run.

### 3.3 Mechanism: what runs where

| In **Node** (the test process) | In the **browser** (the gallery page) |
| ------------------------------ | ------------------------------------- |
| The spec file, `expect`, retries, the runner | The gallery module, `window.mount`, `window.unmount` |
| The `mount` fixture: `page.goto`, `page.evaluate` | The story, the component, providers, state, callbacks |
| `page.route`, `page.request`, fixtures, traces | Your bundler's output (Vite dev server, your plugins and aliases) |
| `import type` of a story (erased at compile time) | The real story module (loaded by `import.meta.glob`) |

The only thing that crosses is the second argument of `mount`, through `page.evaluate`. What arrives, observed on 1.64.1 / Chromium 156 by mounting a story that inspects its own props:

| Value passed in `props` | What the story receives |
| ----------------------- | ----------------------- |
| string, number, boolean, `null`, nested objects and arrays | Same, deep-copied |
| `undefined` value | The key is present with value `undefined` (`'undef' in props` is true) |
| `Date`, `RegExp`, `BigInt`, `URL`, `Error`, `NaN`, `Infinity` | Same type |
| Circular object | Circularity preserved |
| `Map`, `Set` | **A plain `{}`** — silently empty, no error |
| Class instance (`new Point(1, 2)`) | **A plain object** with own data fields; prototype methods and getters are gone (`typeof p.sum === 'undefined'`) |
| **Function** | A callable proxy. Calling it **runs your function in Node** (`typeof process !== 'undefined'` was true there) and the return value comes back to the browser as a resolved promise |

Two consequences. First, the class-instance and `Map`/`Set` rows are the same data limits the legacy flow had (the legacy flow showed `Map → {}` and a lost getter too), so a prop that is "an object with behaviour" must be built *inside* the story from plain data. Second, function props do work, because of `exposeFunctions`, which is what the official migration reference's before/after example relies on. The docs still advise keeping callbacks inside the story, and the reasons are structural: a proxied callback is an asynchronous Node round trip, it is invisible when you open the story by hand in the gallery, and it ties the scenario to a live test process. A story that records into the DOM works in a plain browser tab and is asserted with a retrying `toHaveValue`.

### 3.4 Why stories help

- **No boundary to leak through.** The legacy flow compiled JSX inside the test file, bundled it, and reassembled it in the browser. Providers, mock data and callbacks now execute where the component executes.
- **You own the pipeline.** Aliases, plugins, CSS, Tailwind, SVGR — whatever the app's dev server does, the stories get. The legacy flow ran its own copy of Vite whose config you had to mirror by hand (`ctViteConfig`).
- **Stories are documentation.** Each scenario is a named export you can grep, review in a PR, and open in a browser at the gallery URL (`await window.mount({ story: 'components/Counter/Recorded' })` from the console is exactly what the fixture does).
- **Tests stay boring.** The test owns interactions and assertions only; there is no JSX in a `.ts` spec, and no `jest`/`vi` global to miss.

### 3.5 Behaviour differences that bite during migration

1. **The returned locator is `#root`, not the component's root element.** For a 120 × 30 px button, the legacy `mount()` returned a locator whose `boundingBox()` and `screenshot()` were 120 × 30. The new one gives `#root`, a block `<div>`: `boundingBox()` was 1264 × 30 and the PNG was 1264 × 30. `component.click()` hits the centre of `#root` (x ≈ 640) and misses the button (the counter stayed at 0). Always query from it (`component.getByRole('button').click()`), and for screenshots either screenshot a child locator or give the story an `inline-block` wrapper. Existing baselines will not match.
2. **Every `mount()` navigates.** Isolation is free, but any `page.route()` must be registered **before** `mount()` (verified: a route added after the mount-time fetch is too late; a route added before it is hit, and routes do not leak into the next test even with `reuseContext`).
3. **`reuseContext: true` is an optimisation, not magic.** On 20 trivial tests (1 worker, 3 runs each) it took 5.8–5.9 s versus 7.1–7.4 s without it, roughly 65 ms per test. Worth keeping; "large speedup" would only show on heavier suites. Legacy and gallery runs were indistinguishable otherwise (≈0.3 s per trivial test either way).
4. **First `mount()` after adding a story file to an already-running dev server failed in 4 of 4 attempts** with `page.evaluate: Execution context was destroyed, most likely because of a navigation`; the immediate re-run passed, and `--retries=1` reported it as flaky and healed it. The cause was not isolated (a Vite reload of the gallery as the story graph changes is the plausible suspect). I only saw it with `reuseExistingServer` against a long-lived local dev server; I did not test a fresh CI server, but there the story set is fixed before the server starts.
5. **Vite warned** `ESM syntax in a file loaded as CommonJS (vite.config.ts)` until `"type": "module"` is set in `package.json`. Cosmetic today.

### 3.6 Typing story ids (1.63+)

`mount<typeof Default>(id, props)` type-checks `props` (and `update()`) against the story with no setup. Since 1.63 the id itself can be typed: `@playwright/test` exports an empty `interface Stories {}`, and you augment it, ideally from a generated file:

```typescript
// playwright/gallery/stories.d.ts (commit it; the skill's typing.md ships a small Vite plugin that generates it)
type StoriesOf<Prefix extends string, Mod> = { [K in keyof Mod & string as `${Prefix}/${K}`]: Mod[K] };

declare module '@playwright/test' {
  interface Stories extends
    StoriesOf<'ct52/components/Counter', typeof import('../../src/components/Counter.story')> {}
}

export {};
```

```typescript
await mount('ct52/components/Counter/Default', { start: 1, label: 'ok' });  // typed
// @ts-expect-error  start must be number
await mount('ct52/components/Counter/Default', { start: 'x' });
// @ts-expect-error  unknown prop
await mount('ct52/components/Counter/Default', { nope: 1 });
```

Verified: both `@ts-expect-error` lines are genuine errors (flipping `'x'` to `1` makes `tsc` report TS2578, "unused directive"). Ids not in `Stories` stay accepted as plain strings with untyped props, so adoption can be partial. The id strings are still resolved at runtime by your gallery: renaming a story file breaks specs at runtime unless the registry is in play, and the unique-suffix matching (`Counter/Default`) can silently match a different story after a rename.

### 3.7 Old war story 1, in the new model

The provider that caused the `$NaN` bug lives in the story; the test passes `taxRate` as plain data, including the "still loading" `undefined`:

```tsx
// src/components/PaymentForm.story.tsx
import { PaymentContext, PaymentForm, type PaymentConfig } from './PaymentForm';

export const WithConfig = ({ subtotal = 100, taxRate }: { subtotal?: number; taxRate?: number }) => {
  const config: PaymentConfig = { currency: 'USD', taxRate };
  return (
    <PaymentContext.Provider value={config}>
      <PaymentForm subtotal={subtotal} />
    </PaymentContext.Provider>
  );
};
```

```typescript
// tests/components/payment.spec.ts
import { test, expect } from '@playwright/test';
import type { WithConfig } from '../../src/components/PaymentForm.story';

test('tax rate still loading (undefined): shows placeholder, never NaN', async ({ mount }) => {
  const c = await mount<typeof WithConfig>('PaymentForm/WithConfig', { subtotal: 100, taxRate: undefined });
  await expect(c.getByRole('status')).toHaveText('Loading tax rate...');
  await expect(c).not.toContainText('NaN');
});

test('when the rate arrives, update() flips the same mounted story', async ({ mount }) => {
  const c = await mount<typeof WithConfig>('PaymentForm/WithConfig', { subtotal: 50 });
  await expect(c.getByRole('status')).toBeVisible();
  await c.update({ subtotal: 50, taxRate: 0.1 });
  await expect(c).toHaveText('Total: 55.00 USD');
});
```

(Both pass in the example project, alongside the known-rate case and the four Counter tests: 7 passed.)

---

## 4. Migration: Legacy `experimental-ct-*` to Stories

### 4.1 Side by side

| | **Legacy** (`@playwright/experimental-ct-*`, last `1.62.1`) | **Current** (`@playwright/test` 1.62+) |
| --- | --- | --- |
| Packages | `@playwright/experimental-ct-react` / `-react17` / `-vue` (+ `@playwright/test`, which becomes a second copy) | `@playwright/test` only (+ your own `vite`, framework plugin) |
| Frameworks | React, React 17, Vue (Svelte dropped in 1.59; Solid/Vue 2 dead since 1.49) | Any framework your dev server can render; you write the gallery. Docs ship React and Vue examples; only React was run here |
| Config | `defineConfig` from the ct package, `playwright-ct.config.ts`, `use.ctPort`, `ctViteConfig`, `ctTemplateDir`, `ctCacheDir` | Plain `defineConfig`; a `components` project with `baseURL` = gallery URL, `serviceWorkers: 'block'`, `reuseContext: true`, plus `webServer` |
| Entry | `playwright/index.html` + `playwright/index.tsx` (hooks), build output in `playwright/.cache` | `playwright/gallery/index.html` + `main.tsx` (served live, no build cache) |
| Test imports | `import { test, expect } from '@playwright/experimental-ct-react'` | `import { test, expect } from '@playwright/test'` |
| Spec extension | `.spec.tsx` (JSX in the test; JSX in a `.ts` file is a syntax error, verified) | `.spec.ts` (no JSX) |
| Mount call | `mount(<Button title="Submit" onClick={spy} />)` | `mount('components/Button/Primary', { title: 'Submit' })` |
| Callbacks | Passed as JSX props, marshalled to Node | Story owns the callback and records into a hidden `<input data-testid>`; assert with `toHaveValue()` |
| Children / slots | JSX from the test | One story export per composition |
| Provider / theme setup | `beforeMount` / `afterMount` in `playwright/index.tsx`; `hooksConfig` per test | Body of the gallery's `window.mount` (global) or a decorator in the story; per-test variation as props |
| `update` | `component.update(<Button count={2} />)` | `component.update({ count: 2 })` |
| `unmount` | `component.unmount()` | `component.unmount()` |
| Returned locator | The component's root element | `#root` (see 3.5) |
| Network | `page.route` or the `router` fixture (both worked in 1.62.1) | `page.route` before `mount()`; MSW `setupWorker` inside a story/decorator (docs) |
| Failure on unknown component | Compile-time import | Runtime rejection of `mount()`; typed ids optional (1.63+) |
| Upgrade path | Frozen at 1.62.1 | Moves with every Playwright release |

### 4.2 Steps (from the official guide, with what was verified)

1. Pin the old suite: `@playwright/test@1.62.1` and `@playwright/experimental-ct-react@1.62.1` (same version, or you get the two-runtimes failure in section 2).
2. Add the gallery, the `components` project and `webServer` **alongside** the old CT project. Keep the old project running.
3. Port spec by spec: turn each `mount(<X a={1} />)` into a story export, or into `mount('X/Default', { a: 1 })` when only plain data varies (`export const Default = (props: XProps) => <X {...props} />`). Turn callback spies into recorded state.
4. Move `beforeMount` work into the gallery's `window.mount` or a story decorator; `hooksConfig` becomes props.
5. When the last spec is green: delete the old project, the `@playwright/experimental-ct-*` dependency, `playwright/index.html`, `playwright/index.ts*` and `playwright/.cache`, then lift the 1.62.1 pin and upgrade.

### 4.3 Before and after

```tsx
// Before (legacy): tests-ct/counter.spec.tsx
import { test, expect } from '@playwright/experimental-ct-react';
import { Counter } from '../src/Counter';

test('counts and fires callback', async ({ mount }) => {
  const calls: number[] = [];
  const c = await mount(<Counter start={5} onChange={(n) => calls.push(n)} />);
  await c.getByRole('button').click();
  await expect(c.getByTestId('n')).toHaveText('6');
  expect(calls).toEqual([6]);          // ran on 1.62.1: passes
});
```

```typescript
// After: tests/components/counter.spec.ts, with the `Recorded` story from section 3.2
test('counts and fires callback', async ({ mount }) => {
  const c = await mount('components/Counter/Recorded');
  await c.getByRole('button').click();
  await expect(c.getByTestId('last')).toHaveValue('6');
});
```

Everything below in this chapter that mounts JSX (sections 5, 6, 8–11, 13, 15 and Part A of 16) is **legacy-flow code**. The testing *judgement* in it (what belongs in CT, masking, state coverage, CI wiring) carries over unchanged; the `mount(<... />)` lines become stories as above.

### 4.4 Exercise (current model)

Port Part A of section 16 to stories: one `SearchForm.story.tsx` exporting `Empty`, `Loading`, `Results`, `NoResults` (props from the test where plain data varies) and a `Recorded` story that writes `onSearch`/`onQueryChange` payloads into `data-testid` inputs. Then check two things from section 3.5 on your own component: the bounding box of the returned locator, and what happens when a `page.route` is registered after `mount()`.

---

## 5. Legacy Setup (`experimental-ct-*`, up to 1.62.1)

> **Legacy.** Sections 5, 6 and 8 to 11, the code in 13 and 15, and Part A of 16 use the pre-1.62 API. It only runs if you pin **both** packages to the same version, `1.62.1` (section 2); nothing newer exists. New suites: use sections 3 and 4.

```bash
# both pinned to the last published version; do not use a caret on either
npm i -D @playwright/test@1.62.1 @playwright/experimental-ct-react@1.62.1
npx playwright install
```

Run it with `npx playwright test -c playwright-ct.config.ts` (verified on 1.62.1; the first run also builds the Vite bundle into `playwright/.cache`). Specs that contain JSX must be `.spec.tsx`: the same file as `.spec.ts` fails with `SyntaxError ... Unexpected token, expected ","`.

```typescript
// playwright-ct.config.ts
import { defineConfig, devices } from "@playwright/experimental-ct-react";

export default defineConfig({
  testDir: "./tests-ct",
  use: {
    ...devices["Desktop Chrome"],
    ctPort: 3100,
  },
});
```

```typescript
// playwright/index.tsx — entry-point Playwright loads with your app's CSS, providers
import { beforeMount } from '@playwright/experimental-ct-react/hooks';
import './app.css';
import { ThemeProvider } from '../src/theme';

// React: return the wrapped tree. Verified on 1.62.1: a context provider returned here reaches every mounted component.
beforeMount(async ({ App }) => (
  <ThemeProvider mode="light">
    <App />
  </ThemeProvider>
));
```

---

## 6. Legacy Test Shape (`mount(<Jsx />)`)

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

Note: a `Locator` is returned from `mount`. In this legacy flow it points at the **component's root element** (a 120 x 30 px button gave a 120 x 30 box and screenshot), so `component.click()` hits the component. Because the locator *is* the root element, `component.getByTestId('x')` cannot find the root itself, only descendants. The current model returns `#root` instead (section 3.5).

---

## 7. What CT Can and Can't Do (both models)

**Good fit:**

- Form validation
- Custom inputs (date pickers, color pickers, drag-drop)
- Stateful components (modals, drawers, accordions)
- Component-level a11y (axe-core against the rendered DOM)
- Visual regression of one component

**Bad fit:**

- Network calls — mock at component boundary, not via HTTP. CT can intercept fetch (`page.route` works in both models; the legacy flow also had a `router` fixture), but you're betraying the layer.
- Routing — components that need router context get awkward.
- Auth flows — those belong to E2E.

---

## 8. CT Configuration for Vue and Svelte

**Legacy.** `@playwright/experimental-ct-vue` last shipped as `1.62.1`. `@playwright/experimental-ct-svelte` was removed in 1.59 (last build `1.58.2`), so the Svelte code below needs `@playwright/test@1.58.2`, not 1.62. Both follow the React pattern with different `beforeMount` signatures (taken from each package's `hooks.d.ts`): Vue receives `{ app, hooksConfig }` and returns nothing; Svelte receives `{ App, hooksConfig }` and may return a component. Neither returns JSX.

### Vue 3 (`@playwright/experimental-ct-vue`)

```typescript
// playwright-ct.config.ts
import { defineConfig, devices } from "@playwright/experimental-ct-vue";

export default defineConfig({
  testDir: "./tests-ct-vue",
  use: {
    ...devices["Desktop Chrome"],
    ctPort: 3200, // avoid port conflict with any running E2E config
  },
});
```

```typescript
// playwright/index.ts
import { beforeMount } from '@playwright/experimental-ct-vue/hooks';
import { createPinia } from 'pinia';       // state-management store if used
import './style.css';

const pinia = createPinia();

// Vue's hook receives the app instance directly; register plugins/stores on it. Returns void.
beforeMount(async ({ app }) => {
  app.use(pinia);
});
```

```typescript
// tests-ct-vue/ModalDialog.spec.ts
import { test, expect } from "@playwright/experimental-ct-vue";
import ModalDialog from "../../src/components/ModalDialog.vue";

test("@ct emits close on backdrop click", async ({ mount }) => {
  let closed = false;
  const component = await mount(ModalDialog, {
    props: { open: true },
    on: {
      "update:open": () => {
        closed = true;
      },
    },
  });

  await component.locator(".modal-backdrop").click();
  expect(closed).toBe(true);
});
```

> **Note:** Vue's `beforeMount` receives the `app` instance (`app.use(...)`) and returns nothing; there is no `window.__app__` and no JSX. The `on` property of `mount` attaches event listeners to the component under test, matching Vue 3's emit pattern. In the current model a Vue story is a `.story.ts` using `h(...)` or a `.story.vue` file, and the same events are recorded into a hidden input.

### Svelte (`@playwright/experimental-ct-svelte`)

```typescript
// playwright-ct.config.ts
import { defineConfig, devices } from "@playwright/experimental-ct-svelte";

export default defineConfig({
  testDir: "./tests-ct-svelte",
  use: {
    ...devices["Desktop Chrome"],
    ctPort: 3300,
  },
});
```

```typescript
// playwright/index.ts
import { beforeMount } from '@playwright/experimental-ct-svelte/hooks';
import './app.css';

beforeMount(async ({ hooksConfig }) => {
  // Svelte components are compiled to plain JS — no provider wrapper needed.
  // Global setup (stores, flags from hooksConfig) goes here. Return nothing, or a SvelteComponent
  // to replace the tree. JSX does not exist in this hook.
  void hooksConfig;
});
```

```typescript
// tests-ct-svelte/Drawer.spec.ts
import { test, expect } from "@playwright/experimental-ct-svelte";
import Drawer from "../../src/components/Drawer.svelte";

test("@ct renders open state with navigation links", async ({ mount }) => {
  const component = await mount(Drawer, { props: { open: true } });
  await expect(
    component.getByRole("link", { name: "Dashboard" }),
  ).toBeVisible();
  await expect(component.getByRole("link", { name: "Settings" })).toBeVisible();
});

test("@ct hides links when closed", async ({ mount }) => {
  const component = await mount(Drawer, { props: { open: false } });
  await expect(component.getByRole("link")).toHaveCount(0);
});
```

### Port collision guard

When running CT alongside E2E tests in the same pipeline, port conflicts cause intermittent failures. Always set a distinct `ctPort` per framework project, and use `process.env.CT_PORT` to allow CI injection (legacy only: the current model has no `ctPort`; the port lives in `webServer` and `baseURL`):

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

> Legacy-flow code. Playwright has **no `jest`/`vi` global** (`typeof jest` is `undefined` in the test process), so the original `jest.fn()` calls would throw a `ReferenceError`; a small recorder replaces them. Callbacks passed as JSX props do run in Node (verified on 1.62.1). Sixty consecutive synchronous `expect(spy.calls)` checks right after a `click()` passed; use `expect.poll(() => spy.calls.length)` if a callback is asynchronous.

```typescript
// tests-ct/spy.ts
export function spy<A extends unknown[]>() {
  const calls: A[] = [];
  const fn = (...args: A): void => { calls.push(args); };
  return Object.assign(fn, { calls });
}
```

A `ConfirmDialog` component that accepts `open`, `title`, `message`, and `onConfirm`/`onCancel` props. Tests cover: render closed, render open, backdrop dismiss, confirm button fires callback, cancel button fires callback.

```typescript
// tests-ct/ConfirmDialog.spec.ts
import { test, expect } from '@playwright/experimental-ct-react';
import { ConfirmDialog } from '../src/components/ConfirmDialog';
import { spy } from './spy';

test('@ct does not render when open is false', async ({ mount }) => {
  const component = await mount(
    <ConfirmDialog open={false} title="Delete" onConfirm={spy()} />
  );
  await expect(component.locator('[role="dialog"]')).not.toBeAttached();
});

test('@ct renders and is accessible when open', async ({ mount }) => {
  const component = await mount(
    <ConfirmDialog open={true} title="Delete item" message="This cannot be undone." onConfirm={spy()} />
  );
  const dialog = component.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Delete item' })).toBeVisible();
  await expect(dialog.getByText('This cannot be undone.')).toBeVisible();
});

test('@ct backdrop click calls onCancel', async ({ mount }) => {
  const onCancel = spy<[]>();
  const component = await mount(
    <ConfirmDialog open={true} title="Discard" onCancel={onCancel} onConfirm={spy()} />
  );
  await component.locator('.backdrop').click({ position: { x: 5, y: 5 } }); // click edge to avoid modal
  expect(onCancel.calls).toHaveLength(1);
});

test('@ct confirm button calls onConfirm with payload', async ({ mount }) => {
  const onConfirm = spy<[string]>();
  const component = await mount(
    <ConfirmDialog
      open={true}
      title="Approve"
      itemId="item-42"
      onConfirm={onConfirm}
    />
  );
  await component.getByRole('button', { name: 'Confirm' }).click();
  expect(onConfirm.calls).toEqual([['item-42']]);
});

test('@ct pressing Escape triggers onCancel', async ({ mount, page }) => {
  const onCancel = spy<[]>();
  const component = await mount(
    <ConfirmDialog open={true} title="Close me" onCancel={onCancel} />
  );
  // Focus must be inside the dialog for Escape to work
  await component.getByRole('dialog').focus();
  await page.keyboard.press('Escape');
  expect(onCancel.calls).toHaveLength(1);
});
```

### 9.2 Drawer / Sidebar Component

A `AppDrawer` that slides in from the left, conditionally renders navigation links based on `open`, and emits `navigate` events.

```typescript
// tests-ct/AppDrawer.spec.ts
import { test, expect } from '@playwright/experimental-ct-react';
import { AppDrawer } from '../src/components/AppDrawer';
import { spy } from './spy';

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
  const onClose = spy<[]>();
  const component = await mount(<AppDrawer open={true} onClose={onClose} />);
  await component.locator('.drawer-overlay').click();
  expect(onClose.calls).toHaveLength(1);
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

CT tests should not hit real HTTP endpoints. The component under test should receive data through props or a context provider — never by fetching inside the component. Two patterns cover the vast majority of cases: **callback/prop mocks** and **request interception** (`page.route`, plus the legacy `router` fixture).

### 10.1 Callback / Prop Mocks (Preferred for Pure UI Components)

When the component receives data via props, you can inject whatever shape you need directly:

```typescript
// tests-ct/UserCard.spec.ts
import { test, expect } from '@playwright/experimental-ct-react';
import { UserCard } from '../src/components/UserCard';
import { spy } from './spy';

test('@ct renders user data from props', async ({ mount }) => {
  const component = await mount(
    <UserCard
      user={{ id: 1, name: 'Bob', email: 'bob@example.com', role: 'admin' }}
      onDelete={spy()}
    />
  );
  await expect(component.getByText('Bob')).toBeVisible();
  await expect(component.getByText('bob@example.com')).toBeVisible();
  await expect(component.getByText('admin')).toBeVisible();
});

test('@ct delete button fires onDelete with user id', async ({ mount }) => {
  const onDelete = spy<[number]>();
  const component = await mount(
    <UserCard user={{ id: 42, name: 'Carol', email: 'carol@example.com' }} onDelete={onDelete} />
  );
  await component.getByRole('button', { name: /delete/i }).click();
  expect(onDelete.calls).toEqual([[42]]);
});

test('@ct shows skeleton while loading', async ({ mount }) => {
  const component = await mount(<UserCard loading={true} />);
  await expect(component.locator('.skeleton-avatar')).toBeAttached();
  await expect(component.getByText('Bob')).not.toBeAttached();
});
```

### 10.2 Request Interception for Integration-Flavoured CT

Sometimes a component triggers its own fetch (e.g. a data-fetching hook). Intercept it from the test with Playwright's own routing; register the route **before** `mount()`, because the component fetches as soon as it renders. Both forms below ran against `@playwright/experimental-ct-react@1.62.1` (a component whose `useEffect` fetches `/api/items` showed the fulfilled JSON, and showed its error branch on a 500). The current model uses `page.route` the same way (section 3.5, point 2).

```typescript
// tests-ct/UserProfile.spec.tsx
import { test, expect } from '@playwright/experimental-ct-react';
import { UserProfile } from '../src/components/UserProfile';

test('@ct fetches and displays user from API', async ({ page, mount }) => {
  await page.route('**/api/users/1', (route) =>
    route.fulfill({ json: { id: 1, name: 'Mocked User', email: 'mocked@example.com', role: 'viewer' } }));
  const component = await mount(<UserProfile userId={1} />);
  await expect(component.getByText('Mocked User')).toBeVisible();
});

test('@ct shows error state on API failure', async ({ router, mount }) => {
  // `router` is the legacy CT-only fixture (experimental-ct-core); page.route works too.
  await router.route('**/api/users/999', (route) => route.fulfill({ status: 500 }));
  const component = await mount(<UserProfile userId={999} />);
  await expect(component.getByRole('alert')).toBeVisible();
});
```

> **Correction.** An earlier version of this section wired MSW through an `msw-playwright` package and a `mswDecorator(browserContext, handlers)` helper. That package does not exist on npm (404), the `beforeMount` hook has no `browserContext` parameter, and the second test called `server.use(...)` on a `server` that was never created (and `HttpResponse.error(), { status: 500 }` mixes a network error with a status). MSW's real browser integration is `setupWorker` from `msw/browser`, started in the page (legacy: `playwright/index.tsx`; current model: inside a story or decorator, as the official docs suggest). That route was not run for this chapter, so no MSW code is shown.

### 10.3 When to Use Each Pattern

| Situation                                      | Recommended approach                                       |
| ---------------------------------------------- | ---------------------------------------------------------- |
| Component receives all data via props          | Callback/prop mocks — no MSW needed                        |
| Component uses a data-fetching hook internally | `page.route` before `mount()` (MSW `setupWorker` is the alternative) |
| You want to test loading / error states        | Combine prop mocks with explicit `loading` / `error` props |
| You need to test the HTTP contract itself      | That's E2E — not CT territory                              |

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
    // maxDiffPixelRatio: 0.01,  // relax tolerance for font-rendering differences (there is no `pixelThreshold` option)
    // maxDiffPixels: 50,
  });
});
```

### 11.3 Masking Multiple Dynamic Areas

For dashboards with many dynamic widgets, create a reusable mask array in a shared fixture:

```typescript
// fixtures/component-screenshot.ts
import { Locator } from "@playwright/test";

export function dashboardMasks(root: Locator): Locator[] {
  return [
    root.locator('[data-testid="timestamp"]'),
    root.locator('[data-testid="user-avatar"]'),
    root.locator('[data-testid="notification-badge"]'),
    root.locator(".chart-tooltip"),
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

`toHaveScreenshot` already disables CSS animations and transitions by default: the option `animations` is `"disabled"` unless you pass `"allow"` (checked in `types/test.d.ts` of 1.64.1: "Defaults to `"disabled"` that disables animations"). The hand-rolled `style.transition = 'none'` plus forced reflow that earlier versions of this chapter showed is therefore redundant; just screenshot, and pass `animations: 'allow'` only when the animation is the thing under test.

```typescript
test('@ct screenshot — sidebar open', async ({ mount }) => {
  const component = await mount(<Sidebar open={true} />);
  await expect(component).toHaveScreenshot('sidebar-open.png'); // animations: 'disabled' is the default
});
```

In the current model the screenshot target is `#root` (full width for a block layout, section 3.5), so screenshot a child locator or wrap the story in an `inline-block` element, then regenerate baselines.

---

## 12. Decision Matrix — CT vs E2E vs Jest

Use this matrix to decide which testing layer owns a given scenario. The right answer is usually "the highest level that still gives fast, reliable feedback."

| Concern                  | CT                                     | E2E                                   | Jest / jsdom                   |
| ------------------------ | -------------------------------------- | ------------------------------------- | ------------------------------ |
| **Speed**                | Fast (~1s per test)                    | Slow (~30s per suite)                 | Fastest (~100ms per test)      |
| **Browser realism**      | Real Chromium                          | Real Chromium                         | Fake DOM (jsdom)               |
| **Network layer**        | Mocked or intercepted                  | Real HTTP                             | Mocked via `fetch.mock`        |
| **Component isolation**  | Yes — one component at a time          | No — full app                         | Yes — but no layout            |
| **CSS / layout testing** | Real rendering, accurate box model     | Real rendering                        | Approximate — no layout engine |
| **Auth complexity**      | Avoid — belongs in E2E                 | Own it — test the real flow           | Avoid — mock tokens in props   |
| **Type coverage**        | High — TypeScript props                | Medium — page-level assertions        | High — unit function coverage  |
| **Flakiness**            | Low — isolated, no network             | High — network + timing               | Very low — deterministic       |
| **Debugging experience** | Easy — focused component               | Medium — full page context            | Easy — unit-scale              |
| **When to choose**       | Stateful UI, forms, complex components | Full journeys, auth, multi-page flows | Pure utility functions, hooks  |
| **Typical CI gate**      | Every PR (sub-2 min)                   | Nightly or on-release                 | Every commit                   |

**Decision heuristics:**

- **Choose CT** when you need to assert a component's behaviour in isolation with realistic styling, and speed matters more than network realism.
- **Choose E2E** when the test must span multiple pages, touch real authentication, or verify end-to-end data flows.
- **Choose Jest** when the function under test has no UI, no side effects, and pure unit coverage is the goal.

---

## 13. Anti-patterns

These eight mistakes appear repeatedly and are worth knowing before you write your first CT suite. They apply to both models; the code is legacy-flow JSX unless stated.

### 1. Mocking the API inside CT (should be integration)

CT should test component logic — not HTTP. If you find yourself calling `page.route()` or starting an MSW worker inside a CT test, ask whether this belongs in an E2E integration test instead. (Section 10.2 shows when interception is still the right tool: the component owns its own fetch hook and you are testing its loading and error states.) The component should receive data through props or context, not pull it over the network.

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
await expect(component.locator(".css-1abced")).toBeVisible();

// PREFERRED
await expect(component.getByRole("button", { name: "Submit" })).toBeVisible();
```

### 4. Putting All Components in One Config

**Legacy flow.** A single `playwright-ct.config.ts` shared between React, Vue, and Svelte components will cause silent mount failures because the entry point uses the wrong framework hook. Keep one CT config per framework in its own test directory. (The current model has no such problem by design: the gallery is the only framework-specific file, and a repo with two frameworks gets two galleries and two projects.)

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
  const results = await new AxeBuilder({ page: component.page() }) // page() is a METHOD on Locator
    .include('form')
    .analyze();
  expect(results.violations).toEqual([]);
});
```

### 8. Not Running CT in CI

A test suite that only runs locally is a test suite that will drift. Add CT to the PR pipeline with a separate job that installs dependencies, runs the component project (`npx playwright test --project=components` in the current model; `npx playwright test --config=playwright-ct.config.ts` in the legacy flow), and publishes the HTML report as a CI artifact. A reasonable target: sub-3-minute CT gate on every PR.

```yaml
# .github/workflows/ct.yml
- name: Run Component Tests
  run: npx playwright test --project=components   # legacy: --config=playwright-ct.config.ts
  env:
    CI: true   # makes webServer.reuseExistingServer false: CI always starts a fresh dev server
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
// tests-ct/PasswordInput.spec.tsx — DevSecOps seed (legacy flow; in the current model PasswordInput gets one story and the test passes `value` as a prop)
import { test, expect } from '@playwright/experimental-ct-react';
import { PasswordInput } from '../src/components/PasswordInput';
import { spy } from './spy';

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
  const onChange = spy<[string]>();
  const component = await mount(<PasswordInput locked={true} value="locked" onChange={onChange} />);
  await component.locator('input').fill('new');
  expect(onChange.calls).toHaveLength(0);
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

Create `tests-ct/SearchForm.spec.tsx` (legacy flow; the file must be `.tsx` because it contains JSX; for the current model see 4.4):

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
import { test, expect, Page } from "@playwright/test";

// Helper to seed the page with a particular state
async function mountSearchForm(
  page: Page,
  state: { query: string; loading: boolean; results: unknown[] },
) {
  await page.goto("/search");
  if (state.query) await page.getByRole("textbox").fill(state.query);
  // E2E has no way to force loading/error/empty states without API mocking —
  // you'd need a backdoor or seed data. For fair comparison, time the full API round-trip.
}

test("search form — full round-trip", async ({ page }) => {
  await page.goto("/search");
  const input = page.getByRole("textbox");
  await input.fill("Playwright");
  await page.getByRole("button", { name: /search/i }).click();
  // Wait for real API response
  await expect(page.getByRole("listitem")).toBeVisible({ timeout: 10_000 });
  await expect(
    page.locator('[data-testid="result-title"]').first(),
  ).toBeVisible();
});

test("search form — empty results", async ({ page }) => {
  await page.goto("/search");
  await page.getByRole("textbox").fill("this-wont-match-anything-xyz");
  await page.getByRole("button", { name: /search/i }).click();
  await expect(page.getByText(/no results found/i)).toBeVisible({
    timeout: 10_000,
  });
});

test("search form — loading state during API call", async ({ page }) => {
  await page.goto("/search");
  await page.getByRole("textbox").fill("delay");
  await page.getByRole("button", { name: /search/i }).click();
  // Capture loading spinner — E2E can see this, but timing is flaky
  await expect(page.getByRole("status")).toBeVisible();
});
```

### Part C — Timing Comparison

Run both suites and record timings. Typical (illustrative, not measured here) results on a local machine:

```bash
npx playwright test tests-ct/SearchForm.spec.tsx --config=playwright-ct.config.ts
npx playwright test tests-e2e/search-form.spec.ts --config=playwright.config.ts
```

| Test suite | Tests   | Total time  | Avg per test |
| ---------- | ------- | ----------- | ------------ |
| CT         | 8 tests | ~8 seconds  | ~1 second    |
| E2E        | 3 tests | ~35 seconds | ~11 seconds  |

### Part D — Self-Grading Rubric

| Criterion                        | 0 (Not done)        | 1 (Partial)             | 2 (Complete)         | 3 (Excellent)                 |
| -------------------------------- | ------------------- | ----------------------- | -------------------- | ----------------------------- |
| All 4 states tested in CT        | Fewer than 2 states | 2 states                | 3 states             | All 4 states                  |
| Callback events verified         | No event tests      | 1 event test            | 2 event tests        | 3+ event tests                |
| E2E equivalents written          | No E2E tests        | 1 test                  | 2 tests              | 3 tests with API wait         |
| Timing comparison documented     | Not present         | Rough estimate          | Approximate timings  | Exact timings with table      |
| Mask / visual regression (bonus) | Not attempted       | Screenshot without mask | Screenshot with mask | Multiple states, masked       |
| Accessibility check (bonus)      | Not attempted       | `toBeVisible` only      | One axe-core test    | axe-core on all form elements |

**Passing score:** 8/12 (with E2E equivalence). Bonus points for accessibility and visual regression show senior-level initiative.


---

## Reality Check

**"Component testing replaces unit testing"**→ Component tests render components in a real browser, which is slower than unit tests running in Node.js with JSDOM. Unit tests verify LOGIC (a function calculates correctly), component tests verify RENDERING and INTERACTION (the button is visible and clickable, the form validates input). They test different things — use unit tests for business logic, component tests for UI behavior.

**"Playwright CT works with any framework setup"**→ Since 1.62 it works with any framework your dev server can render, because *you* write the gallery (a few dozen lines) and Playwright only calls `window.mount`. Before 1.62 it did not: the `experimental-ct-*` packages bundled everything with their own Vite, covered React, React 17 and Vue (Svelte was removed in 1.59, Solid and Vue 2 stopped at 1.49), and are now frozen at 1.62.1. Context providers, routers and global stores are set up in stories or decorators (current) or in `beforeMount` (legacy). Test what works out of the box, then evaluate the effort for advanced features.

**"Component tests are faster than E2E tests"**→ Component tests skip: server startup, database setup, authentication, and navigation. This makes them faster per test. But they also miss: API integration bugs, routing bugs, authentication flow bugs, and cross-component interaction bugs. The speed benefit comes at the cost of integration coverage. Component tests complement E2E tests; they do not replace them.

**"Testing every component prop combination is thorough"**→ A component with 5 boolean props has 32 combinations. A component with 3 enum props of 5 values each has 125 combinations. Testing every combination is impractical and unnecessary. Test: default props (most common usage), edge cases (empty data, maximum length, null values), and interaction-dependent props (disabled state prevents click, loading state shows spinner).

**"Component tests should not make network requests"**→ Component tests should mock EXTERNAL network requests (API calls to your backend). But components that use Service Workers, Web Workers, or browser APIs (Intersection Observer, Clipboard API) need the real browser environment that Playwright CT provides. The value of Playwright CT over JSDOM-based testing is exactly this real browser capability. One trap: if your app registers a service worker, set `serviceWorkers: 'block'` in the component project, or cached responses can shadow your `page.route()` mocks.

**"The experimental CT packages are the way to do Playwright component testing"**→ That was true up to 1.62. The packages' last release is 1.62.1 (2026-07-30); the maintained path is the stories-and-gallery model built into `@playwright/test` (sections 2 to 4).

---

## Sources

- Playwright docs, [Component testing](https://playwright.dev/docs/test-components) (source read at tags `v1.62.0` to `v1.64.1`).
- Playwright [release notes](https://playwright.dev/docs/release-notes): 1.62 "New component testing model", 1.63 Announcements, 1.59 Breaking Changes (`experimental-ct-svelte` removed), 1.49 (`-ct-vue2`, `-ct-solid` no longer updated).
- npm registry: version/time lists of `@playwright/test` and `@playwright/experimental-ct-{react,react17,vue,svelte,solid,vue2}`; `msw-playwright` returns 404.
- Everything marked "verified" was run on 2026-10-16: Windows 11, Node 22.13, `@playwright/test@1.64.1` (gallery model) and `@playwright/experimental-ct-react@1.62.1` (legacy), Chromium 156 (1.64.1) and the 1.62.1 build.
