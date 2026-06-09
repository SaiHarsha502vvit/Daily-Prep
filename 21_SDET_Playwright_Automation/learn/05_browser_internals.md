# 05. Browser Internals for SDETs

> The four trees a browser maintains, what each one means for tests, and why understanding the render pipeline turns flaky tests into reliable ones. Conceptual chapter — almost no code. The "why" behind everything in `reference/08_reliability.md`.

---

## The four trees

A browser, while displaying a page, maintains four trees in parallel:

| Tree | What it represents |
|---|---|
| **DOM tree** | The HTML structure as JavaScript sees it |
| **CSSOM tree** | The computed CSS styles for each node |
| **Render tree** | DOM + CSSOM combined, minus invisible nodes |
| **Accessibility tree** | What assistive tech (screen readers) perceive |

Most of what tests do interacts with the DOM tree. But `getByRole`, `getByLabel`, etc. read the ACCESSIBILITY tree. And waits for "visible" check the RENDER tree.

Knowing which tree you're touching changes what you can rely on.

---

## The DOM tree

Parsed from HTML. Mutable via JavaScript.

```html
<div class="card">
  <h2>Title</h2>
  <p>Content</p>
</div>
```

Becomes:

```
HTMLDivElement (.card)
├── HTMLHeadingElement (h2) — text: "Title"
└── HTMLParagraphElement (p) — text: "Content"
```

Tests touch this via `page.locator('.card')`, `getByText('Title')`, etc.

### Key properties

- **Synchronous to JS** — DOM changes are visible to the next line of JS.
- **Mutable** — React/Vue/etc. rewrite it constantly.
- **Detached nodes exist** — a node removed from the tree but referenced by JS is still in memory.

### What this means for tests

When you write:
```typescript
const el = await page.locator('.card').textContent();
```

You're asking the browser: "Find a `.card` in the CURRENT DOM and return its text." It's a snapshot. The DOM might change next millisecond.

Why `expect(loc).toHaveText(...)` is better than `expect(await loc.textContent()).toBe(...)` — it RE-QUERIES on every retry. The snapshot version is one query, one chance.

---

## The CSSOM tree

Parsed from CSS. Joined with the DOM to determine final styles.

```css
.card { background: white; padding: 16px; }
.card.featured { background: yellow; }
```

The CSSOM doesn't have a 1:1 element correspondence with DOM. It's a separate model of rules + selectors + cascade.

### What this means for tests

Computed style — what's ACTUALLY applied — is the join:

```typescript
const bg = await page.locator('.card').evaluate(el => getComputedStyle(el).backgroundColor);
// Reflects DOM state + CSS cascade
```

If your test depends on color, font size, etc., you're reading from the CSSOM. CSS-in-JS, theme switching, and `prefers-color-scheme` all change what's computed.

---

## The render tree

DOM + CSSOM, filtered to what's actually drawn. A `<div style="display: none">` is in the DOM but NOT in the render tree.

### Why this matters

Playwright's "visible" check uses the render tree. An element with `display: none` is "invisible" even though its DOM node exists.

```typescript
// Element exists in DOM
const exists = await page.locator('.hidden').count();   // 1

// But isn't rendered
const visible = await page.locator('.hidden').isVisible();   // false
```

The DOM and render tree DIVERGE for:
- `display: none`
- `<head>` content
- `<template>` content (only DOM, not rendered)
- Detached subtrees

When `.toBeVisible()` retries: it's asking the render tree, not the DOM. A node CAN become visible without changing the DOM (e.g., `display: block` was added).

---

## The accessibility tree

A parallel structure built from the DOM + ARIA attributes. What screen readers traverse.

```html
<button>Save</button>
```

DOM: `HTMLButtonElement`. A11y tree: `{role: "button", name: "Save"}`.

```html
<div role="button" aria-label="Save">💾</div>
```

DOM: `HTMLDivElement`. A11y tree: `{role: "button", name: "Save"}` — same as above.

### What this means for tests

`page.getByRole('button', { name: 'Save' })` queries the A11Y tree, not the DOM.

```typescript
// Finds both examples above
page.getByRole('button', { name: 'Save' });
```

This is why semantic locators are stable: they describe what the user experiences, not how the developer structured it.

Cross-references: [`reference/03_locators.md §4`](../reference/03_locators.md#4-getbyrole), [`deep_dives/accessibility.md`](../deep_dives/accessibility.md).

---

## The render pipeline

When the page changes, the browser:

```
1. JS mutates DOM
   ↓
2. Style invalidation — affected nodes flagged
   ↓
3. Layout (a.k.a. reflow) — bounding boxes computed
   ↓
4. Paint — pixels drawn
   ↓
5. Composite — layers combined to screen
```

Each step is async. JS runs first; rendering happens at the next frame.

### Why this matters for tests

After clicking a button that triggers a CSS change:

```typescript
await page.click('#toggle-theme');
// CSS class has been added to <html>
// But the visual update happens at the next paint
```

If you immediately read `getComputedStyle`, you get the NEW computed value. Good. If you immediately screenshot, you might catch the OLD pixels — paint hasn't happened. That's a 16ms race window.

`requestAnimationFrame` waits for "the next paint." Playwright's animation-detection logic uses this.

---

## The two-phase render in SPAs

Single-page apps (React, Vue, Angular):

```
0ms     URL change handled by router
0ms     Component tree starts rendering
10ms    DOM populated with empty fields, skeleton UI
20ms    domcontentloaded fires
20ms    API call fires (the DATA isn't here yet)
...     network delay
500ms   API response arrives
510ms   Components re-render with real data
510ms   Spinner removed
```

By `domcontentloaded`, the DOM is incomplete. Reading data fields gets empty strings. Visible elements may flicker.

This is why `waitForLoadState('domcontentloaded')` is the WRONG signal for SPAs. The right signal is content-based — `await expect(field).toHaveText(expected)`.

Cross-reference: [`reference/08_reliability.md §8`](../reference/08_reliability.md#8-timing-in-spas-vs-ssr).

---

## Event flow — capture, target, bubble

For `click()` events:

```
window
  ↓ capture
document
  ↓ capture
<body>
  ↓ capture
<div onclick>     ← target
  ↑ bubble
<body>
  ↑ bubble
document
  ↑ bubble
window
```

Three phases:
1. **Capture** — top-down to target. Listeners with `{capture: true}` fire here.
2. **Target** — at the element. Listeners on the target fire.
3. **Bubble** — bottom-up. Listeners on ancestors fire.

### What this means for tests

`page.click()` dispatches a real `MouseEvent`. It goes through all three phases. If a parent has `event.stopPropagation()` in capture phase, the target never sees the click.

For mocking events (`page.dispatchEvent`), you can fire on a SPECIFIC element without the full propagation. Use sparingly — real users get the full propagation.

---

## Layout vs paint

```typescript
element.style.width = '300px';   // triggers layout — synchronous
element.style.color = 'red';     // triggers paint only — cheaper
element.classList.add('foo');    // may trigger layout AND paint
```

Layout (reflow) is expensive. Paint is cheap. CSS that triggers layout on every animation frame causes "jank."

### What this means for tests

A test that reads `getBoundingClientRect` forces a layout. Doing this in a tight loop is slow.

For performance-sensitive tests, batch reads:

```typescript
const positions = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.card')).map(el => 
    el.getBoundingClientRect()
  );
});
```

One layout pass, many results.

---

## The stable bounding box check

Playwright's "is this element actionable" check waits for the bounding box to be stable across two `requestAnimationFrame` calls (~33ms at 60fps).

```
Frame 1: box = {x: 10, y: 20, w: 100, h: 50}
RAF...
Frame 2: box = {x: 10, y: 20, w: 100, h: 50}   ← same → stable, click
```

vs:

```
Frame 1: box = {x: 10, y: 20, ...}
RAF...
Frame 2: box = {x: 15, y: 20, ...}   ← different → still animating, wait
```

This is why infinite spinners cause auto-wait to time out — the box keeps changing.

Cross-reference: [`reference/08_reliability.md §13`](../reference/08_reliability.md#13-auto-waiting).

---

## What this means in practice

For every wait strategy and locator decision, ask:

1. WHICH tree am I touching?
2. WHEN does that tree update?
3. What does "the element is ready" mean for THIS tree?

- DOM update: synchronous to JS.
- CSSOM/render update: next animation frame.
- Accessibility tree: lazy, updated on demand.

A "wait for visible" is waiting for the render tree. A "wait for text content" is waiting for the DOM. They're different — usually they happen together, but for edge cases, the difference matters.

---

## What's next

- [06. Enterprise structure](./06_enterprise_structure.md) — applying these insights to framework design.
- [`reference/08_reliability.md`](../reference/08_reliability.md) — practical wait strategies grounded in this model.
- [`deep_dives/d365.md`](../deep_dives/d365.md) — two-phase render in extreme form.
- [`deep_dives/visual_regression.md`](../deep_dives/visual_regression.md) — animations and bounding box stability.
