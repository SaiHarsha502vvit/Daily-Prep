# Level 2 — Locators & Assertions for Mobile

### Companion track: [Playwright Mobile Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 1](Level_01_Setup_and_First_Mobile_Test.md)

---

## Basics — The Locator Priority Order (Straight From Playwright's Own Docs)

Playwright's own documentation states a specific, ordered preference for how to find elements — and it matters more on mobile than desktop, because mobile layouts are far more likely to use different DOM structure at different breakpoints (a hamburger menu here, a full nav bar there), which makes CSS-selector-based tests break constantly as a responsive layout evolves.

```typescript
// 1. getByRole — "the closest way to how users and assistive technology perceive the page"
page.getByRole('button', { name: 'Sign in' })

// 2. getByText — for non-interactive content (a paragraph, a status message)
page.getByText('Welcome, John')

// 3. getByLabel — the primary choice for form fields
page.getByLabel('Password').fill('secret')

// 4. getByPlaceholder — fallback when there's no real <label>
page.getByPlaceholder('name@example.com')

// 5. getByAltText — images and icon buttons
page.getByAltText('Playwright logo').click()

// 6. getByTitle — elements with a title attribute
page.getByTitle('Issues count')

// 7. getByTestId — "most resilient way of testing" but has zero user-facing
//    semantics; use when nothing above genuinely applies
page.getByTestId('directions').click()
```

**What to avoid, per Playwright's own stated position:** raw CSS or XPath selectors as your default — *"DOM can often change leading to non resilient tests."* A chain like `#tsf > div:nth-child(2) > input` breaks the instant a wrapper `<div>` gets added anywhere in that ancestry, and on mobile, that ancestry very often *does* change between breakpoints even when the visible behavior doesn't.

---

## Concept — Why `getByRole` Wins on Mobile Specifically

```typescript
// Fragile — this class name might only exist on the mobile breakpoint's markup
await page.locator('.mobile-nav-hamburger-icon').click();

// Robust — a hamburger button IS a button, on every breakpoint,
// regardless of what class names or wrapper divs surround it
await page.getByRole('button', { name: 'Open menu' }).click();
```

A responsive site frequently renders **semantically identical, structurally different** markup at different viewport widths — the desktop nav might be a `<nav><ul><li>` list of links, while the mobile nav collapses into a single `<button>` that opens a drawer. A CSS-selector-based test written against the mobile breakpoint's specific class names will silently stop finding anything the moment a CSS refactor touches that markup, even if the button's actual behavior never changed. `getByRole('button', { name: ... })` is defined by what the element **does** (a real ARIA button, or a native `<button>`), not by how it happens to be styled or nested right now.

---

## Real-World Problem — Verifying a Mobile Cart Badge Updates Correctly

```typescript
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 14'] });

test('cart badge count updates after adding an item', async ({ page }) => {
  await page.goto('https://example-shop.com/product/123');

  // getByTestId is the right call here specifically because a cart badge
  // count has no natural accessible role or label of its own — it's
  // exactly the "nothing above applies" case
  const cartBadge = page.getByTestId('cart-badge-count');
  await expect(cartBadge).toHaveText('0');

  await page.getByRole('button', { name: 'Add to Cart' }).click();

  // Auto-retrying assertion — Playwright re-checks this for up to 5 seconds
  // (the default timeout), which matters because the badge update might be
  // a moment behind the click due to a state update or animation
  await expect(cartBadge).toHaveText('1');
});
```

---

## Solution — `expect(locator)` vs `expect(value)`, and Why It's Not Just Style

```typescript
// expect(locator) — auto-retrying, async, waits for the DOM to catch up
await expect(page.getByTestId('cart-badge-count')).toHaveText('1');

// expect(value) — synchronous, checks ONCE, no retrying at all
const badgeText = await page.getByTestId('cart-badge-count').textContent();
expect(badgeText).toBe('1'); // if the badge hasn't updated yet, this FAILS immediately
```

The second version is a real, common source of flaky mobile tests: reading the text out with `.textContent()` first, *then* asserting on the plain string, throws away Playwright's auto-retry entirely — you've turned an async, self-healing assertion into a single synchronous snapshot taken at a specific instant, which may be before the UI has actually updated. **Always prefer `await expect(locator).toHaveText(...)` over extracting the value first and asserting on it separately**, unless you have a specific reason to need the raw value for something else (comparing it against a computed number, for instance).

---

## Challenges

### 🕵️ Code Review — Three Locators, One Reviewer Comment Each

```typescript
test('checkout flow', async ({ page }) => {
  await page.locator('div.header > div:nth-child(3) > button').click();
  // 💬 Reviewer: "what does this button actually do? I can't tell from the selector"

  await page.getByText('Continue').click();
  // 💬 Reviewer: "there are three 'Continue' buttons on this page at different
  //    steps — did this click the right one, or just the first match?"

  const total = await page.getByTestId('order-total').textContent();
  expect(total).toBe('$42.00');
  // 💬 Reviewer: "this occasionally fails locally but passes on retry — any idea why?"
});
```

<details><summary>What each comment is pointing at, and the fix</summary>

**Comment 1** — the reviewer is right that this selector is unreadable and fragile, exactly [this level's own guidance](#basics--the-locator-priority-order-straight-from-playwrights-own-docs) against CSS-selector chains. The real question it's asking, though, is deeper: **you can't tell what it does from the code**, which means the next developer touching this test has to go inspect the live page just to understand what's being clicked. Fix: `page.getByRole('button', { name: 'Proceed to Checkout' })` — the test now documents its own intent.

**Comment 2** — a real, common bug: `getByText('Continue')` with multiple matching elements on the page will either throw a "strict mode violation" error (Playwright's default `strict: true` behavior refuses to guess which one you meant) or, if strict mode is somehow off, silently act on the first match — neither of which is "the right one" by accident. Fix: scope it — `page.getByRole('button', { name: 'Continue' }).nth(1)` if position is genuinely stable, or better, scope to a parent container: `page.getByTestId('shipping-step').getByText('Continue')`.

**Comment 3** — this is [this level's `expect(value)` vs `expect(locator)` lesson](#solution--expectlocator-vs-expectvalue-and-why-its-not-just-style) causing a real flaky test: `.textContent()` reads the DOM once, synchronously, with no retry — if the total hasn't finished updating (a price recalculation after a coupon applies, a currency conversion) by the exact millisecond this line runs, the assertion fails even though the correct value would have appeared a moment later. Fix: `await expect(page.getByTestId('order-total')).toHaveText('$42.00')`.

</details>

---

### ⚡ Speed Round — 5 Locator Choices, 2 Minutes

For each, name the single best locator method from this level's priority list.

1. A submit button with the visible text "Create Account."
2. A profile photo `<img>` tag with `alt="User avatar"`.
3. An input field with no visible `<label>`, but a greyed-out placeholder reading "Search products..."
4. A small red dot indicating an unread notification, with no text content and no natural ARIA role.
5. A `<span>` showing "3 items left in stock" — informational text, not clickable.

<details><summary>Answers</summary>

1. `getByRole('button', { name: 'Create Account' })`
2. `getByAltText('User avatar')`
3. `getByPlaceholder('Search products...')` — note this is a fallback specifically *because* there's no real label; if a label existed, `getByLabel` would be preferred even with a placeholder also present.
4. `getByTestId(...)` — a purely visual indicator with no text and no natural role is exactly the case this level's priority list names as the legitimate use for test IDs.
5. `getByText('3 items left in stock')` — non-interactive content is precisely what `getByText` is for, per this level's own priority list.

</details>

---

**Next → [Level 3: Device Emulation Mastery](Level_03_Device_Emulation_Mastery.md)**
