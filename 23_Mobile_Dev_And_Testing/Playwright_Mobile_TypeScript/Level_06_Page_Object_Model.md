# Level 6 — Page Object Model for Mobile

### Companion track: [Playwright Mobile Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 5](Level_05_Network_Interception_and_Mocking.md)

---

## Basics — What a Page Object Actually Buys You

Every test so far has written raw locators directly in the test body. That works fine for four levels' worth of examples — it stops working the moment a real app changes its markup and you have the same `getByTestId('cart-badge-count')` string duplicated across thirty test files.

```typescript
// A Page Object: a TypeScript class wrapping a Page, exposing SEMANTIC methods
export class ProductPage {
  constructor(private page: Page) {}

  async goto(productId: string) {
    await this.page.goto(`/product/${productId}`);
  }

  async addToCart() {
    await this.page.getByRole('button', { name: 'Add to Cart' }).tap();
  }

  get cartBadge() {
    return this.page.getByTestId('cart-badge-count');
  }
}
```

```typescript
// The test file now reads like a description of user behavior,
// not a list of raw locator calls:
test('adding a product updates the cart badge', async ({ page }) => {
  const productPage = new ProductPage(page);
  await productPage.goto('123');
  await productPage.addToCart();
  await expect(productPage.cartBadge).toHaveText('1');
});
```

If the real app's markup changes — the button's accessible name changes from "Add to Cart" to "Add to Bag" — you fix it in **one place**, `ProductPage.addToCart()`, and every test using it is fixed simultaneously.

---

## Concept — Composing Level 4's Gesture Toolkit Into a Page Object

Page Objects aren't just locator wrappers — they're where reusable interaction logic (like Level 4's swipe/long-press/pinch utilities) actually belongs, instead of scattered across individual test files.

```typescript
import { Page } from '@playwright/test';
import { swipe, longPress } from '../gestures';

export class ProductCarouselPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/carousel');
  }

  async swipeToNextImage() {
    const carousel = this.page.getByTestId('carousel');
    const box = await carousel.boundingBox();
    if (!box) throw new Error('carousel not found');

    await swipe(
      this.page,
      { x: box.x + box.width * 0.8, y: box.y + box.height / 2 },
      { x: box.x + box.width * 0.2, y: box.y + box.height / 2 },
    );
  }

  async longPressImageForOptions() {
    const image = this.page.getByTestId('carousel-active-image');
    const box = await image.boundingBox();
    if (!box) throw new Error('image not found');

    await longPress(this.page, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
  }

  get imageOptionsMenu() {
    return this.page.getByTestId('image-options-menu');
  }
}
```

The test now never touches raw coordinates or `dispatchEvent` calls at all:

```typescript
test('long-pressing the carousel image shows options', async ({ page }) => {
  const carousel = new ProductCarouselPage(page);
  await carousel.goto();
  await carousel.longPressImageForOptions();
  await expect(carousel.imageOptionsMenu).toBeVisible();
});
```

---

## Real-World Problem — Fixtures, So You Stop Writing `new ProductPage(page)` Everywhere

Constructing Page Objects manually in every test is repetitive. Playwright's own fixture system (`test.extend()`) lets you inject them automatically:

```typescript
// fixtures.ts
import { test as base } from '@playwright/test';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';

type MyFixtures = {
  productPage: ProductPage;
  cartPage: CartPage;
};

export const test = base.extend<MyFixtures>({
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
});

export { expect } from '@playwright/test';
```

```typescript
// any test file — import test/expect from YOUR fixtures.ts, not '@playwright/test' directly
import { test, expect } from '../fixtures';

test('checkout flow', async ({ productPage, cartPage }) => {
  // productPage and cartPage arrive already constructed — no `new` anywhere in the test
  await productPage.goto('123');
  await productPage.addToCart();
  await cartPage.goto();
  await expect(cartPage.itemCount).toHaveText('1');
});
```

`async ({ page }, use) => { await use(new ProductPage(page)); }` is the fixture contract: request whatever built-in fixtures you need (`page` here), construct your object, hand it to the test via `use()`. Playwright handles the setup/teardown lifecycle around that `use()` call automatically.

---

## Solution — Avoiding the God Page Object

[DOC_08's anti-pattern content](../Flutter_Bootcamp/Reference/DOC_08_Patterns_and_AntiPatterns.md#the-god-widget) named this shape for Flutter widgets — it applies identically to Page Objects:

```typescript
// Anti-pattern: one class knows about the entire app
class AppPage {
  async loginAsUser() { /* ... */ }
  async addToCart() { /* ... */ }
  async applyPromoCode() { /* ... */ }
  async checkOut() { /* ... */ }
  async viewOrderHistory() { /* ... */ }
  async updateProfile() { /* ... */ }
  // 40 more methods, all in one file, all coupled together
}
```

**Why it's bad, in the same shape as the Flutter version:** any change to *any* screen touches this one file, git-blame becomes useless for figuring out who owns what, and every test importing `AppPage` pulls in fixture setup for screens it doesn't even use. The fix is the same one, too — split by screen/responsibility, exactly the composition-over-one-giant-class instinct:

```typescript
class LoginPage { /* only login-related methods */ }
class ProductPage { /* only product-detail-related methods */ }
class CartPage { /* only cart-related methods */ }
class CheckoutPage { /* only checkout-related methods */ }
```

Each Page Object owns exactly one screen's worth of locators and actions — the same "one widget, one responsibility" discipline this whole bootcamp has applied to Flutter widgets, now applied to test code.

---

## Challenges

### 🕵️ Code Review — A Page Object With a Leaky Abstraction

```typescript
export class CartPage {
  constructor(private page: Page) {}

  get itemCount() {
    return this.page.getByTestId('cart-item-count');
  }

  async removeItem(index: number) {
    // 💬 Reviewer: "why does the TEST need to know cart items are
    //    rendered as .cart-item divs? Doesn't that defeat the point
    //    of a Page Object?"
    await this.page.locator('.cart-item').nth(index).locator('button.remove').click();
  }
}
```

<details><summary>What the reviewer is pointing at</summary>

🔴 **Explanation:** the reviewer isn't objecting to the *existence* of a CSS selector inside the Page Object — that's actually fine, and arguably the whole point: [this level's own guidance](#basics--what-a-page-object-actually-buys-you) is that raw locator details belong *inside* the Page Object, not scattered across test files. The real issue is narrower and worth noticing precisely: `.cart-item` and `button.remove` are exactly the fragile CSS-class selectors [Level 2's locator priority guidance](Level_02_Locators_and_Assertions.md#basics--the-locator-priority-order-straight-from-playwrights-own-docs) warned against — being *inside* a Page Object doesn't make a bad locator good, it just moves where the fragility lives. The fix applies Level 2's lesson, not a Page-Object-specific one:

```typescript
async removeItem(index: number) {
  await this.page.getByTestId('cart-item').nth(index).getByRole('button', { name: 'Remove' }).click();
}
```

The lesson worth taking forward: **Page Object Model organizes *where* locators live, it doesn't automatically make them resilient — Level 2's locator-priority rules still apply fully inside every Page Object method.**

</details>

---

### 🏗️ Build It Blind — Design a `SearchPage` Fixture

No starter code. Spec only:

> Design a `SearchPage` Page Object for a mobile search screen: a search input, a "search" button, and a results list where each result has a name and a price. It needs a method to search for a term, a method to get the count of results, and a method to tap a specific result by its visible name (not by index — search results reorder based on relevance, so index-based selection would be fragile). Then write the `test.extend()` fixture that injects it.

<details><summary>One reasonable solution</summary>

```typescript
// pages/SearchPage.ts
import { Page } from '@playwright/test';

export class SearchPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/search');
  }

  async searchFor(term: string) {
    await this.page.getByPlaceholder('Search products...').fill(term);
    await this.page.getByRole('button', { name: 'Search' }).click();
  }

  get resultsList() {
    return this.page.getByTestId('search-results').getByRole('listitem');
  }

  async resultsCount(): Promise<number> {
    return this.resultsList.count();
  }

  async tapResultByName(name: string) {
    // getByRole scoped to a specific text match — NOT index-based,
    // so it survives results reordering by relevance between runs
    await this.resultsList.filter({ hasText: name }).click();
  }
}

// fixtures.ts addition
export const test = base.extend<MyFixtures & { searchPage: SearchPage }>({
  // ...existing fixtures...
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
});
```

🔴 **Explanation:** `tapResultByName` deliberately avoids `.nth(index)` — the spec's own reasoning ("search results reorder based on relevance") is a real-world constraint that should shape the API design, not just an implementation detail. `.filter({ hasText: name })` locates by content, which stays correct regardless of ordering — the same "identify by what something *is*, not by its position" principle behind [Week 2's `ValueKey(item.id)` lesson](../Flutter_Bootcamp/Phase_1_Dart_and_Foundations/Week_02b_Widget_Rebuild_Challenges.md#w2-2-medium--keys-and-the-reordering-bug) from the Flutter side of this repo, showing up again here in test-automation form.

</details>

---

**Next → [Level 7: Multi-Device Config](Level_07_Multi_Device_Config.md)**
