# Challenge 04 — New Tab Scenario

> Handle a click that opens a new tab without race conditions, then assert across both tabs.

## Target site

[https://the-internet.herokuapp.com/windows](https://the-internet.herokuapp.com/windows)

## Required files

```
challenges/solutions/CH04/
├── utilities/browser/tab-manager.ts
├── websites/the-internet/pages/WindowsPage.ts
├── websites/the-internet/pages/NewWindowPage.ts
└── tests/the-internet/new-tab.spec.ts
```

## Acceptance criteria

### `tab-manager.ts`

- Exports `openTabFrom(page, action)` that:
  - Registers the `waitForEvent('page')` listener **before** triggering the action.
  - Returns the new `Page`.
- Exports `closeTab(page)` that closes the page and asserts it is closed.

### POMs

- `WindowsPage` exposes a `clickOpenWindowLink()` method that integrates with `openTabFrom`.
- `NewWindowPage` exposes `expectLoaded()` asserting the visible heading text.

### Test

- The test opens the new tab, asserts the new tab's heading, switches focus back to the original tab, asserts the original is still interactive.
- Closes the new tab as part of teardown.
- Tagged `@regression`.

## Pass condition

- Test passes 20× in a row with `--repeat-each=20`.
- Test passes under `--workers=4` without cross-test interference.
- Trace shows both tabs in the timeline.

## Hints

<details><summary>The race-condition trap</summary>

❌ Wrong:

```typescript
await page.click("#open");
const newTab = await context.waitForEvent("page"); // listener registered TOO LATE
```

✅ Right:

```typescript
const [newTab] = await Promise.all([
  context.waitForEvent("page"),
  page.click("#open"),
]);
```

</details>

## What this teaches

- Promise.all ordering for event listeners.
- That tabs share a `BrowserContext` (cookies/auth) but have separate `Page` objects.
- The discipline of closing tabs you opened — otherwise parallel test memory blows up.
