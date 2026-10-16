# 69. What's New in Playwright 1.57 → 1.64 — A Verified Delta From the 1.49–1.60 Baseline

**Navigation**: [← 45. AI Agents, MCP & Playwright](./45_AI_Agents_MCP_And_Playwright.md) | [Index](../00_INDEX.md) | [→ Stage 8 — SDET → SDE Bridge](../08_SDET_to_SDE_Bridge/README.md)

**Cross-links:**

- [`52. Component Testing`](./52_Component_Testing_With_Playwright_CT.md) — written against `@playwright/experimental-ct-*`; §3 below says what 1.62/1.63 did to that model
- [`45. AI Agents, MCP & Playwright` §6.2](./45_AI_Agents_MCP_And_Playwright.md#62-playwright-test-agents--planner-generator-healer-built-in-since-156) — the deep dive on the 1.56 Test Agents; §4.1 below only verifies it
- [`09. Parallel Execution & Workers`](../02_Test_Architecture/09_Parallel_Execution_Workers.md) — the `fullyParallel` / `serial` model that §1.2 (locks) and §1.4 (`--shuffle`) depend on
- [`26. Flakiness Diagnosis & Fixing`](../06_CI_CD_And_Reliability/26_Flakiness_Diagnosis_and_Fixing.md) — why §1.1 (isolated retries) is a diagnostic tool, not a cure
- [`labs/HARNESS_GUIDE.md`](../labs/HARNESS_GUIDE.md) — the measure-don't-believe method every example below follows

---

## 5W1H

- **WHAT**: A version-by-version delta of Playwright 1.57 through 1.64 against this module's 1.49–1.60 baseline: what each new feature does, the smallest example that actually runs, what it changes for an existing suite, and which old APIs were removed or re-defaulted on the way.
- **WHY**: The module was written and stamped against 1.60 ([`00_INDEX.md`](../00_INDEX.md)). Four releases later, two of them change code you may already have (`--update-snapshots=missing`, `devices[...]`' `screen`), one retires the component-testing packages Ch52 teaches, and several others make a workaround from an earlier chapter unnecessary.
- **WHO**: Anyone upgrading a suite from 1.4x–1.60, and anyone who has just read an AI-written or blog-post summary of "what's new" and needs to know which lines of it are true.
- **WHEN**: Before you bump `@playwright/test` — read §6 (breaking changes) and §7 (checklist) first; the feature sections are for after the upgrade is green.
- **WHERE**: `playwright.config.ts`, the test runner CLI, locators, component tests, the HTML report, and the browser build you download.
- **HOW**: Every claim here is one of: **ran** on `@playwright/test@1.64.1` (and, for behaviour that *changed*, run against 1.60.0 too so the before/after is measured), **typed** (present or absent in the `.d.ts` of each intermediate release, so the "landed in" version is checked and not copied), **registry** (an `npm view` query), or **notes** (the official release notes only — flagged as such in the §8 table).

> **Environment for every measurement**: Windows 11, Node 22.13, TypeScript 7.0.2 (`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`), `@playwright/test` 1.64.1 → Chromium 156.0.8078.4 (Chrome for Testing). "Latest stable" on 2026-10-16 is 1.64.1 (`npm view @playwright/test dist-tags`); `engines.node` is `>=20`.

---

## 0. The Claims You Were Handed — Scorecard

An outside review listed the following. Each was treated as a hypothesis and checked against the release notes **and** the installed typings/behaviour:

| Claim | Verdict | Correction / nuance |
| --- | --- | --- |
| 1.56: Test Agents (planner / generator / healer), `npx playwright init-agents` | **Confirmed** | `init-agents --help` on 1.64.1 lists six loops: `claude`, `codex`, `copilot`, `opencode`, `vscode`, `vscode-legacy`. Deep dive lives in Ch45 §6.2. |
| 1.57: Speedboard (HTML-report timing view) | **Confirmed** | It is an *icon link* (title `Speedboard`, URL `#?speedboard`) beside the status filters — not a text tab — and it lists **Slowest Tests**. A Timeline joined it in 1.58 for merged reports (notes only). |
| 1.57: Chrome for Testing is "the default Chromium channel" | **Partly wrong** | It is not a *channel*. Since 1.57 the `chromium` browser Playwright **downloads** is a Chrome for Testing build (headed → `chrome`, headless → `chrome-headless-shell`). `channel: 'chrome'` still means *your installed* Chrome. |
| 1.60: `test.abort()` | **Confirmed** | `abort(message?: string): never`. Present in the 1.60.0 typings, absent in 1.59.1. |
| 1.62: isolated retries | **Confirmed** | The API is `retryStrategy: 'isolated'` (default `'immediate'`). There is no feature literally called "isolated retries". |
| 1.62: new component-testing model (stories + galleries, `mount('id')`) | **Confirmed** | Plus a consequence the review omitted: the `@playwright/experimental-ct-*` packages stopped being published (§3). |
| 1.63: test locks | **Confirmed** | `{ lock: 'name' }` on tests and describes, plus `describe.configure({ lock })`. |
| 1.63: cross-frame / visible-only locators | **Confirmed** | Cross-frame = `frameLocator()` with **no selector**; visible-only = `locator.visible()`. |
| 1.64: `Locator.within()` | **Confirmed** | `a.within(b)` ≡ "`a`, inside `b`"; `.nth()` resolves per parent. |
| 1.64: WebMCP | **Confirmed, with fine print** | `page.webmcp` exists, but it is **experimental** and throws unless Chromium is launched with `--enable-features=WebMCP`. WebKit does not implement it. |

**False hypotheses: none outright.** One needed correcting (Chrome for Testing is a *build swap*, not a channel). Nothing was unconfirmable, but WebMCP's browser-side API shape is still moving — see §4.2.

---

## 1. Test Runner

### 1.1 Isolated retries — `retryStrategy: 'isolated'` (1.62)

**What it does.** By default (`'immediate'`) a failed test is retried the moment a worker is free, interleaved with the rest of the suite. With `'isolated'`, retries are held back until everything else has finished, then run **one by one in a single worker**. That removes "the retry was disturbed by 3 other tests hammering the same backend" as an explanation, which is exactly the question you ask when a test is *flaky* rather than *broken*.

```typescript
// retry/playwright.config.ts
import { defineConfig } from '@playwright/test';

const strategy = process.env.STRATEGY === 'isolated' ? 'isolated' : 'immediate';
export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  workers: 2,
  retries: 1,
  retryStrategy: strategy,
  reporter: 'dot',
});
```

```typescript
// retry/flaky.spec.ts — one test that fails on attempt 0, six steady ones; each logs who ran it
import { test } from '@playwright/test';
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

const log = (msg: string): void => appendFileSync(join(__dirname, '..', 'retry-log.txt'), `${msg}\n`);

test('flaky: fails on first attempt', async ({}, testInfo) => {
  log(`flaky attempt=${testInfo.retry} worker=${testInfo.workerIndex}`);
  await new Promise<void>((r) => setTimeout(r, 200));
  if (testInfo.retry === 0) throw new Error('first attempt fails');
});

for (let i = 1; i <= 6; i++) {
  test(`steady ${i}`, async ({}, testInfo) => {
    log(`steady${i} worker=${testInfo.workerIndex}`);
    await new Promise<void>((r) => setTimeout(r, 400));
  });
}
```

**Measured run order** (`STRATEGY=immediate` vs `isolated`, 2 workers):

```
immediate: flaky#0  steady1  steady2  flaky#1  steady3  steady4  steady5  steady6
                                       ^^^^^^^ retried as soon as a worker was free
isolated:  flaky#0  steady1  steady3  steady4  steady2  steady5  steady6  flaky#1
                                                                          ^^^^^^^ last, alone
```

Both runs end `6 passed`, with the report line `1 flaky`. Wall time 2.6 s vs 3.0 s — the cost of isolation is that the retry cannot overlap with anything.

**What it changes for existing suites.** Nothing, unless you opt in. Opt in when you triage flakiness (Ch26): if a test that fails in the crowd passes in isolation, the cause is *interference* (shared state, a rate-limited backend, CPU starvation), not the test body. Do **not** leave it on permanently as a CI pass-rate booster — it lengthens the tail of every run that has a failure, and a retry that passes still counts as flaky (pair with `failOnFlakyTests: true`, 1.52).

### 1.2 Test locks — `{ lock: 'name' }` (1.63)

**What it does.** Tests that share a lock name never run at the same time — across files, workers **and projects** — while everything else stays parallel. It is the precise tool for "these three tests mutate one global account setting", where the old answer was `workers: 1` or `describe.serial` for the whole suite.

```typescript
// locks/a.spec.ts
import { test } from '@playwright/test';
import { criticalSection } from './helper';   // logs start/end timestamps, sleeps 600 ms

test('A1 update settings', { lock: 'user-settings' }, async () => { await criticalSection('A1'); });
test('A2 unrelated', async () => { await criticalSection('A2-free'); });
```

```typescript
// locks/b.spec.ts
import { test } from '@playwright/test';
import { criticalSection } from './helper';

test.describe.configure({ lock: 'user-settings' });   // every test in this file takes the lock

test('B1 rename user', async () => { await criticalSection('B1'); });
test('B2 delete user', async () => { await criticalSection('B2'); });
```

Config: `fullyParallel: true, workers: 4`. Measured start/end offsets in ms:

```
without locks   A1 [56..664]  A2 [5..617]  B1 [36..648]  B2 [0..602]    -> all 4 overlap (6 of 6 pairs)
with locks      A2-free [0..602]
                A1      [6..618]
                B1               [639..1254]        waited for A1
                B2                          [1274..1886]   waited for B1
                -> only A1&A2 overlap (A2 holds no lock)
```

Three details that are easy to get wrong (all measured):

1. **Without `fullyParallel`, a lock is held for the whole file.** In the default and `serial` modes a file's tests run together in order, so a lock on *one* test holds it from that test's start until the file's last test finishes. Measured with `a.spec.ts` (locked `A1`, unlocked `A2`) and `c.spec.ts` (locked `C1`), `workers: 4`:

   | `fullyParallel` | A1 | A2 (same file, **no** lock) | C1 |
   | --- | --- | --- | --- |
   | `false` | 0–612 | 630–1234 | 1249–1861 (waited for A2 too) |
   | `true` | 0–608 | 22–623 | 625–1232 |

2. **`describe.configure({ lock })` accumulates** — repeated calls add locks, they don't replace them (docs).
3. **A test may hold several locks** (`{ lock: ['database', 'external-api'] }`) and starts only when *all* are free; Playwright acquires them all before the test begins and releases them when it ends.

**What it changes.** If you currently use `workers: 1`, `test.describe.serial` or a hand-rolled file-lock fixture purely to stop two tests colliding on one resource, a lock is smaller and keeps the rest of the suite parallel. It is *not* a substitute for test-data isolation (Ch28): locks serialise the symptom; unique data removes the cause.

### 1.3 `test.abort()` (1.60)

**What it does.** Fails the *currently running* test immediately with `Test aborted: <message>`. It is typed `never`, so it composes like a `throw` inside an expression — a TypeScript comparison worth knowing:

```typescript
// tests/abort.spec.ts
import { test } from '@playwright/test';

test('route handler aborts the test with a message', async ({ page }) => {
  await page.route('**/publish', (route) => {
    test.abort('Tests must not publish to the shared page.');
    return route.abort();
  });
  await page.setContent('<button id=b>go</button>');
  await page.evaluate(() => fetch('http://example.invalid/publish').catch(() => 'blocked'));
  await page.waitForTimeout(500);
});

test('abort() returns never, so it narrows like a throw', async () => {
  // string | undefined  ??  never   ->   string
  const baseUrl: string = process.env.BASE_URL ?? test.abort('BASE_URL is required');
  console.log('BASE_URL =', baseUrl);
});
```

Output (first test): `Error: Test aborted: Tests must not publish to the shared page.`, followed by `page.evaluate: Test ended.` for the in-flight call — the abort ends the test *now*, it does not wait for your `await` to return. Second test, `BASE_URL` unset: `Error: Test aborted: BASE_URL is required`; set: passes.

**Honest scope.** I tried to construct a case where a *plain* `throw new Error(...)` inside a route handler or a `page.on('console')` listener is swallowed, and could not: on 1.64.1 both also fail the test immediately. So `test.abort()` is not a new capability for those two places; what it adds is an explicit, tagged intent (`Test aborted:` prefix), the `never` return type for control-flow narrowing, and a documented guarantee for fixtures, hooks and handlers. Use it to make a "this is a misuse, stop" guard greppable. Don't rewrite existing `throw`s.

### 1.4 `--shuffle` and `project.default` (1.64)

```bash
npx playwright test --shuffle            # prints: "Running 42 tests using 4 workers, shuffle seed 563190075"
npx playwright test --shuffle 563190075  # replays that order
```

Measured with six tests in one file, `--workers=1`:

| Config | seed 1 | seed 2 | seed 1 again |
| --- | --- | --- | --- |
| `fullyParallel: false` | a b c d e f | a b c d e f | a b c d e f |
| `fullyParallel: true` | e d f a b c | a e d b f c | e d f a b c |

So `--shuffle` randomises **scheduling units**, not individual tests: with `fullyParallel: false` a file's tests stay in order and only the **file order** moves (two files: `two → shuf` for seed 1, `shuf → two` for seeds 2 and 3). To flush out *test-to-test* order dependence inside a file you need `fullyParallel: true` (or `test.describe.configure({ mode: 'parallel' })`). Same seed → same order, so a shuffle-only failure is reproducible — that is the whole point.

```typescript
// misc/playwright.config.ts (excerpt)
projects: [
  { name: 'chromium', use: devices['Desktop Chrome'] },
  { name: 'slow',     use: devices['Desktop Chrome'], default: false },   // 1.64
],
```

`npx playwright test` now runs only `chromium` (measured: `--list` shows `[chromium]` only); `--project=slow` runs it; `--project="*"` runs everything (10 tests across the two projects here). On CI, write `--project="*"` explicitly — otherwise a project someone marked `default: false` silently stops running.

### 1.5 `updateSnapshots` — a re-definition, not just an addition (1.50 and 1.64)

Two separate changes, both of which hit [Ch29](./29_Visual_Regression_Testing.md)-style suites:

- **1.50**: `updateSnapshots: 'all'` now rewrites *every* snapshot; the old "only what changed" behaviour is the new `'changed'` value.
- **1.64**: the unset default is now spelled **`'default'`** (missing snapshots are written *and the test fails*, so CI can't silently pass). **`'missing'` now means "write the missing ones and pass".**

Measured on a one-screenshot test with no baseline on disk:

| Version | no flag | `--update-snapshots=missing` |
| --- | --- | --- |
| 1.60.0 | `1 failed` ("A snapshot doesn't exist … writing actual") | `1 failed` (same) |
| 1.64.1 | `1 failed` | **`1 passed`** |

Anyone who ran `--update-snapshots=missing` in CI to *seed* baselines used to get a red run and a manual re-run; now it is green and commits the new baselines — which means a typo'd snapshot name also goes green. Treat `missing` as an authoring mode, not a CI mode. ([`appendix/quick_reference/02_config.md`](../appendix/quick_reference/02_config.md) still lists the default as `'missing'`; that is the pre-1.64 spelling, and 1.60's behaviour for it was already "write and fail".)

---

## 2. Locators

All four examples below passed on 1.64.1 (`tests/locators.spec.ts`).

### 2.1 `Locator.within()` (1.64)

```typescript
test('Locator.within scopes a locator you already have (1.64)', async ({ page }) => {
  await page.setContent(`
    <div data-testid=settings-dialog><button>Save</button></div>
    <div data-testid=other-dialog><button>Save</button></div>`);
  const saveButton = page.getByRole('button', { name: 'Save' });
  const dialog = page.getByTestId('settings-dialog');

  await expect(saveButton).toHaveCount(2);                    // two Save buttons on the page
  await expect(saveButton.within(dialog)).toHaveCount(1);     // "this button, within that dialog"
  await expect(dialog.getByRole('button', { name: 'Save' })).toHaveCount(1);  // the old chain, same answer
});
```

The old way scopes by chaining *from the parent* (`dialog.getByRole(...)`), so the parent must be in hand first. `within()` lets you keep a reusable child locator in a Page Object and scope it later — the direction POM code actually wants. The part that is genuinely new is `.nth()`/`.first()` resolving **per parent**:

```typescript
test('within() resolves .nth() per parent: column queries (1.64)', async ({ page }) => {
  await page.setContent(`<table>
    <tr><td>Apple</td><td>x</td><td>1</td></tr>
    <tr><td>Banana</td><td>y</td><td>2</td></tr></table>`);
  const secondCellOfEveryRow = page.getByRole('cell').nth(1).within(page.getByRole('row'));
  await expect(secondCellOfEveryRow).toHaveText(['x', 'y']);                       // one per row
  await expect(page.getByRole('row').getByRole('cell').nth(1)).toHaveText('x');   // old chain: ONE cell
});
```

Same expression shape, different answer: `parent.child.nth(1)` picks the 2nd cell *of the whole match set*; `child.nth(1).within(parent)` picks the 2nd cell *inside each parent*. If you port a "column" helper, re-check which one your old code relied on.

### 2.2 `Locator.visible()` (1.63) and `filter({ visible })` (1.51)

```typescript
const buttons = page.locator('button');              // one display:none, one visible
await expect(buttons.visible()).toHaveCount(1);
await expect(buttons.filter({ visible: true })).toHaveCount(1);   // 1.51 spelling
await buttons.visible().click();                     // strict mode passes: one visible match
```

The docs now call `.visible()` "the recommended way" in place of the `:visible` CSS pseudo-class. It is a recommendation, not a removal: [Ch02](../01_Foundations/02_Enterprise_Locators_XPath.md) and the appendix locator sheets still use `":visible"` and it still works. Note the docs' caveat — visibility is evaluated **every time the locator is used**, not when `.visible()` is called. To match *invisible* elements use `filter({ visible: false })`.

### 2.3 `frameLocator()` with no selector (1.63)

```typescript
await page.setContent(`<iframe srcdoc="<button onclick=&quot;document.title='clicked'&quot;>Pay</button>"></iframe>`);
await page.frameLocator().getByRole('button', { name: 'Pay' }).click();   // finds the button in ANY frame
```

Before: `page.frameLocator('iframe[name=checkout]')` — you had to know and keep the iframe selector (the D365 and payment chapters spend pages on exactly this). Now the rest of the locator is searched across all frames and **resolved inside a single frame**. If it matches in two frames it throws — measured with two identical iframes:

```
Error: locator.click: frameLocator() matched elements in multiple frames.
```

So it is a convenience for "I don't care which frame", not a way to fan out over frames. Keep an explicit selector wherever more than one frame could plausibly contain the same role/name (ad iframes, duplicate widgets).

---

## 3. Component Testing — The Stories Model (1.62) and What Happened to `experimental-ct-*` (1.63)

**What changed.** Ch52 teaches `@playwright/experimental-ct-react|vue|svelte`: JSX in the test file, Playwright's own Vite bundle and server, `ctPort`, `beforeMount` hooks. 1.62 introduced a different model and the old packages were retired:

| Fact | Evidence |
| --- | --- |
| 1.62 adds the built-in `mount` fixture on plain `@playwright/test` | typings: `mount: <Story, Id>(storyId, props?) => Promise<Locator & { update, unmount }>` is present in 1.62.0, absent in 1.61.0 |
| 1.63: `experimental-ct-react`, `-react17`, `-vue` "will no longer be updated" | release notes 1.63 |
| 1.64 docs: those packages "have been removed and are no longer published… stay on 1.62" | docs `test-components` @ `release-1.64` |
| Registry: `experimental-ct-react`/`-react17`/`-vue` `latest` = **1.62.1**; `-svelte` = **1.58.2** (removed in 1.59, notes); `-solid` = **1.48.2** | `npm view <pkg> dist-tags` |

**The model.** A *story* is a tiny component that renders the thing-under-test in one scenario (hard-coded props, mock data, providers) and records outcomes into the DOM. A *gallery* is a page **you** serve from **your** dev server that exposes `window.mount({ story, props })` and `window.unmount()` rendering into `#root`. The `mount(id)` fixture navigates to the gallery, calls `window.mount`, and hands you a `Locator` scoped to `#root`. Playwright compiles and serves nothing.

The smallest thing that runs — a framework-free gallery (the contract is just two functions on `window`):

```javascript
// ct/gallery-server.mjs (excerpt: the page served at /gallery)
const stories = {
  'components/Counter/Default': (root, props) => {
    const state = (root.__state ??= { clicks: 0 });
    root.innerHTML = '<button>Clicked ' + state.clicks + ' x (step ' + (props.step ?? 1) + ')</button>' +
      '<form hidden><input data-testid=clicks readonly value=' + state.clicks + '></form>';
    root.querySelector('button').onclick = () => { state.clicks += props.step ?? 1; stories['components/Counter/Default'](root, props); };
  },
};
const root = document.getElementById('root');
window.mount = async ({ story, props = {} }) => {
  const key = Object.keys(stories).find((k) => k === story || k.endsWith('/' + story));
  if (!key) throw new Error('Unknown story: ' + story);
  stories[key](root, props);
};
window.unmount = async () => { root.innerHTML = ''; root.__state = undefined; };
```

```typescript
// ct/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [{
    name: 'components',
    testDir: '.',
    use: {
      ...devices['Desktop Chrome'],
      baseURL: 'http://localhost:5199/gallery',   // mount() navigates HERE
      serviceWorkers: 'block',                    // a SW must not shadow page.route() mocks
      reuseContext: true,                         // 1.62: reuse the context between tests in a worker
    },
  }],
  webServer: { command: 'node gallery-server.mjs', cwd: __dirname, url: 'http://localhost:5199/gallery' },
  reporter: 'list',
});
```

```typescript
// ct/counter.spec.ts
import { test, expect } from '@playwright/test';

test('story mount: click records state, update() keeps it', async ({ mount }) => {
  const component = await mount('components/Counter/Default', { step: 2 });
  await component.getByRole('button').click();
  await expect(component.getByTestId('clicks')).toHaveValue('2');

  await component.update({ step: 5 });                 // re-render, same root, state preserved
  await expect(component.getByTestId('clicks')).toHaveValue('2');
  await component.getByRole('button').click();
  await expect(component.getByTestId('clicks')).toHaveValue('7');

  await component.unmount();
  await expect(component.getByRole('button')).toHaveCount(0);
});

test('unknown story: mount() rejects', async ({ mount }) => {
  await expect(mount('Nope/Missing')).rejects.toThrow('Unknown story');
});
```

Both pass; typechecks under all five strict flags. Where `mount` takes a story *type* (`mount<typeof WithTitle>('Button/WithTitle', { title: 'Hello' })`) the props are type-checked against the story's signature; since 1.63 ids can also be typed through a generated `Stories` registry (the typings declare an empty `interface Stories {}` to be augmented).

**What this breaks in Ch52's code.** The callback style — `mount(<LoginForm onSubmit={(p) => { payload = p; }} />)` then `expect(payload)...` — has no equivalent, because there is no Node↔browser callback marshalling any more. The replacement is the "stateful story" pattern shown above: the story owns the callback, writes the outcome into a hidden `<input data-testid>`, and the test asserts it with a *web-first* `toHaveValue` (which retries — the old `expect(payload).toEqual(...)` right after `click()` was a race). Per-test JSX becomes one named story export per composition. `beforeMount`/`hooksConfig`/`ctPort`/`ctViteConfig` have no counterpart; global setup moves into the gallery's `window.mount` body.

**Migration decision.**

- **Pinned to 1.62.x, working suite**: nothing breaks. The packages still install; they just never get a 1.63+. You also cannot take any other 1.63+ feature in this document until you migrate, because `@playwright/test` and the CT packages must match.
- **Moving to 1.63+**: stand up the gallery (the docs ship an agent skill for this: `npx playwright init-skills`), port spec-by-spec while both projects coexist on 1.62, then drop the `experimental-ct-*` dependency, `playwright/index.*` and `playwright/.cache`. The docs' mapping table is in `test-components` → "Migration from the experimental packages".
- **Svelte/Solid**: no first-party path was ever promised; Svelte's package stops at 1.58.2. The gallery contract is framework-agnostic, so you write the page yourself.

---

## 4. Agents and MCP

### 4.1 Playwright Test Agents (1.56) — confirmed; see Ch45

Verified by running `npx playwright init-agents --loop=claude` in an empty project on 1.64.1. It wrote:

```
.claude/agents/playwright-test-{planner,generator,healer}.md   agent definitions
.mcp.json                                                      MCP server config (npx playwright run-test-mcp-server; `cmd /c` wrapper on Windows)
specs/README.md                                                where plans go
tests/seed.spec.ts                                             the seed test the agents run first
```

`--help` also shows `-c/--config`, `--project` (which project supplies the seed) and `--prompts`. The typings matrix confirms the command shipped in 1.56.1 and was absent in 1.55.0. The docs say to **re-run `init-agents` after every Playwright upgrade** to pick up new tools — which makes the generated files part of your upgrade checklist (§7). Everything about what the agents can and cannot be trusted with is in [Ch45 §6.2](./45_AI_Agents_MCP_And_Playwright.md#62-playwright-test-agents--planner-generator-healer-built-in-since-156); this chapter adds nothing to it.

Related and newer: 1.62 bundles the MCP server and CLI (`npx playwright mcp`, `npx playwright cli`); 1.59 added `npx playwright test --debug=cli` and `npx playwright trace …` for agent-driven debugging (notes only).

### 4.2 WebMCP — `page.webmcp` (1.64)

**What it does.** [WebMCP](https://webmachinelearning.github.io/webmcp/) lets a *page* register tools (`name`, `description`, `inputSchema`, `execute`) for an AI agent to call. `page.webmcp.tools()` lists them and `page.webmcp.callTool(name, input)` invokes one — so the tools your app exposes to agents can be tested like any other API surface.

Findings that the release-note snippet doesn't tell you:

1. **Without the launch flag it throws**, with a precise message: `WebMCP is not enabled. Launch the browser with the "--enable-features=WebMCP" argument.` (measured). With the flag but no tools, `tools()` returns `[]`.
2. **The page-side API moved.** On Chromium 156 the object is `document.modelContext` (and `window.ModelContext` exists); `navigator.modelContext` was `undefined`. Playwright's own helper reads `document.modelContext ?? navigator.modelContext`. Register tools with the same feature-detection or your fixture page will break on the next Chromium roll.
3. It needs a **secure context** to be exposed at all, so the example serves the page from a routed `https://` origin rather than `data:`.
4. WebKit does not implement it; Firefox needs two prefs (`dom.modelcontext.enabled`, `dom.modelcontext.testing.enabled`) — from the typings' doc comment, not run.

```typescript
// tests/webmcp.spec.ts
import { test, expect } from '@playwright/test';

test.use({ launchOptions: { args: ['--enable-features=WebMCP'] } });   // required in 1.64

interface ModelContextLike { registerTool(tool: unknown): void; }

test('page.webmcp lists and calls page-registered tools (1.64)', async ({ page }) => {
  await page.route('https://app.test/', (route) => route.fulfill({ contentType: 'text/html', body: '<title>t</title>' }));
  await page.goto('https://app.test/');

  await page.evaluate(() => {
    const host = document as unknown as { modelContext?: ModelContextLike };
    const nav = navigator as unknown as { modelContext?: ModelContextLike };
    const mc = host.modelContext ?? nav.modelContext;
    if (!mc) throw new Error('WebMCP not exposed by this browser build');
    mc.registerTool({
      name: 'add',
      description: 'Adds two numbers',
      inputSchema: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } }, required: ['a', 'b'] },
      execute: async ({ a, b }: { a: number; b: number }) => ({ content: [{ type: 'text', text: String(a + b) }] }),
    });
  });

  const tools = await page.webmcp.tools();
  expect(tools.map((t) => t.name)).toEqual(['add']);
  const result = await page.webmcp.callTool('add', { a: 2, b: 40 });
  expect(result.content[0].text).toBe('42');
});
```

(In a *real* test the page registers its own tools; the `registerTool` block above only exists so the example is self-contained.) Because `callTool` returns `Serializable` (effectively `any`), strict TypeScript lets `result.content[0].text` through — validate the shape yourself. The docs also warn that tool names, descriptions, schemas and results come from the page, so **treat them as untrusted input**; `annotations` expose `readOnly`, `untrustedContent` and `consequential` hints to filter on.

**What it changes for existing suites.** Nothing, unless your product ships WebMCP tools. If it does, add a launch-flag project for it rather than enabling the flag everywhere — it is an experimental browser feature and changes Chromium's surface for every test that shares the browser.

---

## 5. Browser Build, Reporting and Smaller Additions

### 5.1 Chrome for Testing (1.57)

Measured on 1.64.1 (`browsers.json`: title `Chrome for Testing`, Chromium 156.0.8078.4):

| What you launch | Executable actually running |
| --- | --- |
| `chromium.launch()` (default, headless) | `ms-playwright\chromium_headless_shell-1248\chrome-headless-shell-win64\chrome-headless-shell.exe` |
| `chromium.launch({ channel: 'chromium' })` (new headless / headed) | `ms-playwright\chromium-1248\chrome-win64\chrome.exe` |

So "headed uses `chrome`, headless uses `chrome-headless-shell`" (the release note) holds, and `npx playwright install chromium` downloads both. The registry code that distinguishes CfT builds appears in the 1.57.0 package and not in 1.56.1. Effect on suites: the browser toolbar icon/title changes (visible in headed runs and some video/screenshot frames of the browser chrome — rare in practice); no functional change was observed or promised. On Arm64 Linux 1.57 kept using Chromium; **1.63 moved it to CfT too**, so only an old arm64 CI image can still differ. Pixel baselines of *page content* are not documented as affected, but if a visual diff appears right after the bump, regenerate with the review step from [Ch29](./29_Visual_Regression_Testing.md), do not blindly update.

### 5.2 Speedboard (1.57) and the 1.58+ report changes

Open the HTML report and click the icon labelled **Speedboard** (it navigates to `#?speedboard`). With three tests sleeping 100/900/400 ms it printed `Total time: 3.4s` and **Slowest Tests** in order `waits 900ms 981ms`, `waits 400ms 478ms`, `waits 100ms 241ms`, with file:line. Use it as the first stop for "why is the suite 40 minutes": it ranks by wall duration per test, not by step. Later additions (notes only, not exercised): Timeline in the Speedboard for merged/sharded reports (1.58), a duration waterfall beside steps and `mergeFiles` reporter option (1.62–1.63), the built-in `perfetto` reporter (1.63).

### 5.3 A batch of small, verified additions

All in `misc/misc.spec.ts`, 5 passed on 1.64.1:

```typescript
// playwright.config.ts excerpt — webServer.wait (1.57): wait for a LOG LINE, capture the port
webServer: {
  command: 'node srv.mjs',
  wait: { stdout: /Listening on port (?<my_server_port>\d+)/ },   // named group -> env var MY_SERVER_PORT
},
```

```typescript
test.use({ baseURL: `http://localhost:${process.env.MY_SERVER_PORT ?? 3000}` });

test('AbortSignal cancels an assertion (1.62)', async ({ page }) => {
  await page.setContent('<p>still loading</p>');
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 300);
  const err = await expect(page.getByText('Done')).toBeVisible({ signal: controller.signal }).catch((e: Error) => e);
  // measured: rejected after 308 ms with "expect(locator).toBeVisible() failed" — default timeout is 5000
});

test('expect.soft.poll (1.61)', async () => {
  let n = 0;
  await expect.soft.poll(() => ++n, { timeout: 2000 }).toBeGreaterThan(3);
});

test('Locator.drop delivers files to a drop zone (1.60)', async ({ page }) => {
  await page.setContent(`<div id=dz style="width:100px;height:100px" ondragover="event.preventDefault()"
     ondrop="event.preventDefault();this.textContent=event.dataTransfer.files[0].name+':'+event.dataTransfer.files.length">drop</div>`);
  await page.locator('#dz').drop({ files: { name: 'note.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') } });
  await expect(page.locator('#dz')).toHaveText('note.txt:1');
});

test('step subtitle/params (1.63) and WebStorage (1.61)', async ({ page }) => {
  await test.step('Login', async () => {
    await page.goto('/');
    await page.localStorage.setItem('token', 'abc');
    expect(await page.localStorage.getItem('token')).toBe('abc');
  }, { subtitle: 'as admin', params: { user: 'admin' } });
});
```

- `webServer.wait` replaces the "poll a URL" readiness check when the service only prints a ready message. (Do not combine it with a hard-coded `baseURL` port; read the env var.)
- `signal` — passing one does **not** disable the default timeout; pass `timeout: 0` for that (docs).
- `Locator.drop` removes the need for hand-written `DataTransfer` event simulation — the caveat in [Ch58](../03_Real_World_Scenarios/58_File_Uploads_Downloads.md)'s Reality Check ("drag-and-drop upload zones require DataTransfer event simulation") no longer applies to files or text/URI payloads.
- `page.localStorage` / `page.sessionStorage` (1.61) replace `page.evaluate(() => localStorage...)` for the current origin.
- Also in this range (notes only): WebAuthn passkeys via `context.credentials` (1.61), HAR via `tracing.startHar` (1.60), `Page.screencast` (1.59), `APIRequestContext` cookie methods and `TestProject.default` (1.64), WebP screenshots (1.62), video `fps`/VP9 (1.64), `description` in `getByRole` (1.60), `request.get<User>(…)` typed `json()` (1.63).

---

## 6. Breaking Changes and Deprecations, 1.50 → 1.64 — What Touches This Module

Only entries that can affect code in this module or a suite like it. "Verified" means I ran or compiled it; entries marked *notes* are from the release notes and not exercised.

| Ver | Change | Hits this module? | Migration | Verified |
| --- | --- | --- | --- | --- |
| 1.64 | `devices['…']` now forwards `screen`; `window.screen`/media queries see the emulated screen | any `...devices['Desktop Chrome']` project that reads `screen.*` or screen-size media queries | Opt out with `screen: undefined`, or fix the assertion | **Ran 1.60 vs 1.64**: `screen` `1280×720` → `1920×1080` (viewport stayed `1280×720`) |
| 1.64 | Elements inside a hidden iframe (`visibility:hidden`) are hidden | D365/payment iframe tests ([Ch10](../04_Cross_Site_Patterns_And_D365/10_Dynamics365_CRM_Testing.md), [Ch67](../03_Real_World_Scenarios/67_Payment_Gateway_Testing.md)) | A test that "worked" by clicking inside a hidden frame now waits and times out — wait for the frame to become visible | **Ran**: `isVisible()` `true` (1.60) → `false` (1.64) |
| 1.64 | `--update-snapshots=missing` passes; unset default is `'default'` | [Ch29](./29_Visual_Regression_Testing.md); `appendix/quick_reference/02_config.md` row | See §1.5 | **Ran 1.60 vs 1.64** |
| 1.64 | JSX in tests follows `tsconfig` (`jsx`, `jsxFactory`, `jsxImportSource`), default automatic runtime | only JSX specs (Ch52's CT examples) | Set `jsx` in `tsconfig.json` | *notes* |
| 1.63 | `experimental-ct-react`/`react17`/`vue` frozen; Ubuntu 20.04 unsupported | Ch52; Docker/CI base images ([Ch59](../06_CI_CD_And_Reliability/59_Docker_For_Playwright.md)) | §3; use Ubuntu ≥ 22.04 | **Registry** (`dist-tags`) / *notes* |
| 1.62 | Clipboard isolated from the OS in headless | clipboard tests ([Ch43](../06_CI_CD_And_Reliability/43_Real_World_SDET_War_Stories.md) War Story 15) | In-page `navigator.clipboard` round-trip is unaffected; anything reading the *OS* clipboard from Node now sees nothing from the page | **Ran**: grant `clipboard-read`/`write`, write+read round-trip passes (1.64.1); OS-isolation itself *notes* |
| 1.62 | Debian 11 unsupported | CI images | Bump base image | *notes* |
| 1.60 | `ConsoleMessage.location()` exposes `line`/`column`; `lineNumber`/`columnNumber` deprecated | custom console collectors | Rename | *notes* |
| 1.60 | Removed: `Locator.ariaRef()`, `exposeBinding` `handle` option, `logger` option on `connect`/`connectOverCDP`, context options `videosPath`/`videoSize` | none found by grep in the module's `.md`/`.ts` (the `logger:` hit in `appendix/quick_reference/04_fixtures.md` is a *fixture* named `logger`, unrelated) | `recordVideo` for video; tracing for logs | *notes*, grep |
| 1.60 | Runner errors on `workers: 0`/negative and on overriding a non-option fixture in config | configs generated from env vars (`workers: Number(process.env.W)` → `0`) | Use a positive integer, or omit | **Ran**: `config.workers must be a positive number` — same text on 1.60.0 and 1.64.1 |
| 1.59 | Removed `@playwright/experimental-ct-svelte`; `junit` reporter now emits `<error>` for non-assertion errors (was `<failure>`); macOS 14 WebKit dropped | Ch52 §8 (Svelte); CI parsers of JUnit XML | Count `<error>` + `<failure>` in dashboards | registry / *notes* |
| 1.58 | Removed `launchOptions.devtools` (use `args: ['--auto-open-devtools-for-tabs']`); removed `_react`/`_vue` selector engines and the `:light` suffix; macOS 13 WebKit dropped | [`appendix/quick_reference/02_config.md`](../appendix/quick_reference/02_config.md) §5.5 shows `launchOptions: { devtools: true }` | Replace with the arg | **Compiled** on 1.60.0 and 1.64.1: `TS2769 … 'devtools' does not exist in type 'Omit<LaunchOptions, "tracesDir">'` |
| 1.57 | **Removed `page.accessibility`** (deprecated 3 years) | already handled in Ch45 and `topic_summaries/accessibility.md` | `locator.ariaSnapshot()` + axe-core | **Ran**: `typeof page.accessibility` → `undefined` on 1.60 and 1.64 |
| 1.56 | `BrowserContext.backgroundPage` event deprecated, `backgroundPages()` returns `[]` | extension-testing code | none replaces it | *notes* |
| 1.55 | Chromium extension manifest v2 unsupported | extension tests | Port the extension to MV3 | *notes* |
| 1.54 | Node 16 removed; Node 18 deprecated; `-gv` removed (use `--grep-invert`); `playwright open` no longer opens the recorder (use `codegen`) | `appendix/quick_reference/01_quickstart.md` says "Node 18+ required" | 1.64.1's `engines.node` is **`>=20`** — fix the quickstart | **Registry** + grep (module already uses `--grep-invert`) |
| 1.52 | Glob URL patterns no longer support `?` and `[]` as wildcards | [Ch31](../03_Real_World_Scenarios/31_API_Mocking_page_route.md) uses `**/api/v2/citations?userId=**` | `?` is now literal: that exact pattern still matches (it *means* a literal `?`). A pattern relying on `?` as "any one character" silently stops matching — use a regex | **Ran 1.60 and 1.64**: literal-`?` route → `MOCKED`; `**/api/v?/other` wildcard → real server hit |
| 1.52 | `route.continue()` ignores a `Cookie` header override | cookie-injection via `route.continue({ headers })` | `context.addCookies()` | **Ran**: server saw the browser's cookie `real=1`, not the injected `fake=2` |
| 1.50 | `toBeEditable()`/`isEditable()` **throw** on non-editable elements; `updateSnapshots: 'all'` re-defined | negative editable assertions | `.not.toBeEditable()` on a `<div>` no longer passes → assert on the right element or use `toBeDisabled`/attributes | **Ran**: `.not.toBeEditable()` on a `<div>` fails with `expect(locator).not.toBeEditable() failed`; `isEditable()` throws `Element is not an <input>, <textarea>, <select> or [contenteditable]…` |

**Deprecations without removal**: `Screencast.showActions` `fontSize` (1.64, replaced by `style`); `ConsoleMessage` `lineNumber`/`columnNumber` (1.60). The `:visible` pseudo-class is *discouraged*, not deprecated (§2.2).

---

## 7. Upgrade Checklist (1.60 → 1.64.1)

1. `npm view @playwright/test dist-tags` — pin the exact version (`"@playwright/test": "1.64.1"`, no caret in CI) and confirm `node --version` is ≥ 20.
2. If you use `@playwright/experimental-ct-*`: **stop** — stay on 1.62.1 for that project, or plan the §3 migration first.
3. `npm i -D @playwright/test@1.64.1 && npx playwright install` (re-download: Chromium is now `chromium-1248`/`chromium_headless_shell-1248`; add `--with-deps` on fresh CI images, not older than Ubuntu 22.04 / Debian 12).
4. `npx tsc --noEmit` under your strict flags — catches removed options (`devtools`) at compile time.
5. `grep -rn "updateSnapshots\|update-snapshots"` — decide `missing` vs `default` deliberately (§1.5); do not seed baselines in CI with `missing`.
6. `grep -rn "devices\[" playwright.config.ts` + any `screen.`/media-query assertions — run the suite once, then re-run with `screen: undefined` if something moved.
7. Run the suite; triage failures against §6 (hidden-iframe visibility, glob `?`, `toBeEditable`) *before* blaming flakiness.
8. Explicit `--project="*"` in CI if anyone uses `default: false`.
9. Re-run `npx playwright init-agents --loop=<yours>` if you use the Test Agents; diff against your edits (it overwrites — see Ch45).
10. Run once with `--shuffle` and `fullyParallel: true`; keep the printed seed with any failure.
11. Optional wins (take after green): `retryStrategy: 'isolated'` for triage runs; `lock` instead of `workers: 1`; `Locator.visible()`/`within()`/`frameLocator()` in new code only.
12. Update the version stamp in `00_INDEX.md` and the `updateSnapshots` default row in `appendix/quick_reference/02_config.md` (coordinator task — not edited by this chapter).

---

## 8. Feature → Version → How It Was Verified

"Typed" = present/absent in the `.d.ts` of the neighbouring releases (so the landing version is measured). "Ran" = executed on 1.64.1.

| Feature | Version | Verified how |
| --- | --- | --- |
| Test Agents, `init-agents` | 1.56 | **Ran** `init-agents --loop=claude` (files listed §4.1); command present in 1.56.1 package, absent in 1.55.0; docs |
| Speedboard | 1.57 | **Ran**: opened generated HTML report, clicked `Speedboard`, read ranking; string present in 1.57.0 report bundle, absent in 1.56.1 |
| Chrome for Testing build | 1.57 | **Ran**: process executable paths for default vs `channel:'chromium'`; `browsers.json` title; CfT registry code in 1.57.0, not in 1.56.1 |
| `webServer.wait` | 1.57 | **Ran** (`MY_SERVER_PORT` = 5288) |
| `page.accessibility` removed | 1.57 | **Ran** 1.60 + 1.64 (`undefined`) |
| `test.abort()` | 1.60 | **Ran** (3 variants); typed: 1.60.0 yes, 1.59.1 no |
| `Locator.drop()` | 1.60 | **Ran**; typed: 1.60.0 yes |
| `expect.soft.poll`, WebStorage | 1.61 | **Ran**; `page.localStorage` typed: 1.61.0 yes, 1.60.0 no |
| `retryStrategy: 'isolated'` | 1.62 | **Ran** both strategies; typed: 1.62.0 yes, 1.61.0 no |
| Stories model, `mount('id')`, `update`/`unmount` | 1.62 | **Ran** (gallery + config + spec); typed: 1.62.0 yes, 1.61.0 no |
| `experimental-ct-*` frozen | 1.62.1 final (1.63 notice) | **Registry** `dist-tags`; docs |
| `signal` option, `reuseContext` | 1.62 | **Ran**; typed: 1.62.0 yes, 1.61.0 no (both) |
| Test locks (`lock`, `describe.configure`) | 1.63 | **Ran** (overlap analysis, with/without `fullyParallel`); typed: 1.63.0 yes, 1.62.0 no |
| `frameLocator()` no selector | 1.63 | **Ran** (single + multi-frame error); typed: 1.63.0 yes, 1.62.0 no |
| `Locator.visible()` | 1.63 | **Ran**; typed: 1.63.0 yes, 1.62.0 no |
| `test.step` `subtitle`/`params` | 1.63 | **Ran** (accepted; reporter rendering not inspected); typed: 1.63.0 yes, 1.62.0 no |
| `Locator.within()` | 1.64 | **Ran** (2 variants); typed: 1.64.0 yes, 1.63.0 no |
| WebMCP (`page.webmcp`) | 1.64 | **Ran** with and without flag; typed: 1.64.0 yes, 1.63.0 no |
| `project.default`, `--shuffle` | 1.64 | **Ran** (`--list`, seeds, both `fullyParallel` modes); `default` typed: 1.64.0 yes, 1.63.0 no |
| `screen` forwarding, hidden-iframe visibility, `missing` snapshots | 1.64 | **Ran** 1.60.0 vs 1.64.1 |
| Glob `?`, `Cookie` header, `toBeEditable`, `workers:0`, `devtools` | 1.52 / 1.50 / 1.60 / 1.58 | **Ran / compiled** on 1.60.0 and 1.64.1 |
| Clipboard isolation, passkeys, HAR on tracing, screencast, video `fps`/VP9, perfetto reporter, timeline | 1.59–1.64 | Release notes only (not exercised) |

---

## 🏋️ Practice Challenges

**Challenge 1 — Predict the lock schedule.** `workers: 4`, `fullyParallel: false`. `x.spec.ts` has two 600 ms tests, the first with `{ lock: 'db' }`, the second unlocked. `y.spec.ts` has one 600 ms test with `{ lock: 'db' }`. When does `y`'s test start, and why? Then say what changes with `fullyParallel: true`. Run it to check your prediction.

**Challenge 2 — Shuffle to find a hidden dependency.** Write a file with two tests where the second reads a module-level variable the first sets. Under which config does `--shuffle <seed>` ever run them in the wrong order? Find a seed that makes it fail, then explain why `fullyParallel: false` never would.

**Challenge 3 — Port a callback test to a story.** Convert `mount(<LoginForm onSubmit={(p) => { payload = p; }} />); … expect(payload).toEqual({ username: 'Admin', password: 'admin123' })` from Ch52 §3 to the stories model. Write the story (or, for the vanilla gallery above, the story function) and the spec. What assertion replaces the bare `expect(payload)`, and why is it safer?

**Challenge 4 — Triage an upgrade.** After bumping 1.60 → 1.64.1 three things happen: (a) `tsc` fails on `launchOptions: { devtools: true }`; (b) a CI step `playwright test --update-snapshots=missing` that used to fail the pipeline on new screenshots now passes; (c) a test asserting `await page.evaluate(() => screen.width)` equals `1280` under `...devices['Desktop Chrome']` fails. For each: is it a bug in Playwright, in the suite, or in the process — and what is the one-line fix?

<details>
<summary>Challenge 1 — answer</summary>

`y`'s locked test starts only after **the whole of `x.spec.ts` finishes** — about 1.2 s in, not 0.6 s — because in the default (non-`fullyParallel`) mode a file's tests run together in order and a lock on any test in the file is held until the file's last test ends. Measured: A1 0–612, A2 (unlocked, same file) 630–1234, C1 1249–1861. With `fullyParallel: true` each test is its own unit: the locked `x` test runs 0–608, its unlocked sibling runs concurrently (22–623), and `y`'s test starts at ~625 once the lock frees (ends 1232).

</details>

<details>
<summary>Challenge 2 — answer</summary>

```typescript
// order.spec.ts
import { test, expect } from '@playwright/test';
let shared: string | undefined;
test('sets', () => { shared = 'ready'; });
test('reads', () => { expect(shared).toBe('ready'); });
```

With `fullyParallel: true` and `--workers=1`, `--shuffle` schedules each test as its own unit, so the order depends on the seed. Measured over seeds 1–12: **fail** for 1, 2, 3, 5, 6, 9 (`reads` ran first); **pass** for 4, 7, 8, 10, 11, 12. Loop the seeds (`for s in $(seq 1 12); do npx playwright test --workers=1 --shuffle $s; done`), keep the first failing one and replay it — the same seed reproduces the same order. With `fullyParallel: false` the two tests are one unit and always run top-to-bottom; only file order is shuffled, so an intra-file dependency can never fail (all 12 seeds passed) — consistent with the `a b c d e f` rows in §1.4. With `fullyParallel: true` and `--workers=2` (no shuffle at all) the pair failed in 3 of 3 runs for a different reason: workers don't share memory, so `shared` is `undefined` in the worker that runs `reads`. That is also a suite bug, found without shuffle.

</details>

<details>
<summary>Challenge 3 — answer</summary>

The story owns the callback and records into the DOM:

```tsx
// LoginForm.story.tsx
import { useState } from 'react';
import { LoginForm } from './LoginForm';

export const RecordsSubmit = () => {
  const [payload, setPayload] = useState<unknown>(null);
  return <>
    <LoginForm onSubmit={setPayload} />
    <form hidden><input data-testid='payload' readOnly value={JSON.stringify(payload)} /></form>
  </>;
};
```

```typescript
test('valid submit fires onSubmit with payload', async ({ mount }) => {
  const component = await mount('components/LoginForm/RecordsSubmit');
  await component.getByLabel('Username').fill('Admin');
  await component.getByLabel('Password').fill('admin123');
  await component.getByRole('button', { name: 'Sign in' }).click();
  await expect(component.getByTestId('payload')).toHaveValue(
    JSON.stringify({ username: 'Admin', password: 'admin123' }),
  );
});
```

(The React story is not executed here — it needs a React gallery; the same pattern is executed in the vanilla gallery in §3.) `toHaveValue` is a web-first assertion that **retries** until the state lands; the original `expect(payload).toEqual(...)` ran once, immediately after `click()` resolved, and depended on the marshalled callback having already fired. (`JSON.stringify` key order follows the object's insertion order, so keep the component's payload key order stable or compare parsed JSON.)

</details>

<details>
<summary>Challenge 4 — answer</summary>

(a) Suite — Playwright removed `launchOptions.devtools` in 1.58; replace with `args: ['--auto-open-devtools-for-tabs']` (compile error is the correct early warning). (b) Process — 1.64 redefined `missing` as "write and pass"; use the default (unset) in CI so new screenshots fail, and keep `missing` for local authoring. (c) Suite assumption — 1.64 forwards the descriptor's `screen` (1920×1080) so `window.screen` is now the emulated screen while the viewport stays 1280×720; assert on `innerWidth`/the viewport if you meant the viewport, or set `screen: undefined` to restore the old behaviour. None is a Playwright bug; all three are documented breaking changes and were reproduced in §1.5/§6.

</details>

---

## Reality Check

**"Playwright 1.6x has a built-in component-testing mode, so `@playwright/experimental-ct-react` is the current way"** → The opposite. The experimental packages stopped at 1.62.1 (`-svelte` at 1.58.2, `-solid` at 1.48.2); the current way is the built-in `mount('story/id')` fixture against a gallery page you serve from your own dev server. A guide that still starts with `npm i -D @playwright/experimental-ct-react` is describing 1.62 or older.

**"Chrome for Testing is the new default channel"** → `channel` selects *which installed browser* to drive (`'chrome'`, `'msedge'`, `'chromium'`). What 1.57 changed is what `npx playwright install chromium` downloads. Setting `channel: 'chrome'` still launches the Chrome on your machine, which is a different (branded, auto-updating) binary.

**"`test.abort()` is how you stop a test cleanly"** → It *fails* the test (`Test aborted: …`) — it is not `test.skip()`. It ends the test at the call site and any in-flight awaits die with `Test ended`. And on 1.64.1 a plain `throw` in a route handler fails the test just as quickly, so it is a clarity tool, not a new capability.

**"Locks make my tests thread-safe"** → Locks order *when* tests run; they do not isolate *what* they touch. Two locked tests that both leave the account in a modified state still poison the third, unlocked test that reads it. Without `fullyParallel`, a lock also covers the whole file, so one locked test can serialise more than you intended.

**"`--update-snapshots=missing` is how CI seeds new baselines safely"** → Since 1.64 it passes the run, which means a mistyped snapshot name goes green and writes a new baseline nobody reviewed. The unset default (`'default'`) deliberately fails the run that creates files; use `missing` while authoring, not in the pipeline.

**"`page.webmcp` lets me test any MCP server"** → It exercises the tools a *page* registers through the experimental browser WebMCP API, only in a Chromium launched with `--enable-features=WebMCP` (or Firefox with two prefs). It is unrelated to testing a standalone MCP server over stdio/HTTP, which is [Ch45](./45_AI_Agents_MCP_And_Playwright.md)'s territory.

---

**Navigation**: [← 45. AI Agents, MCP & Playwright](./45_AI_Agents_MCP_And_Playwright.md) | [Index](../00_INDEX.md) | [→ Stage 8 — SDET → SDE Bridge](../08_SDET_to_SDE_Bridge/README.md)
