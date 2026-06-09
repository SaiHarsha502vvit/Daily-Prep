// quiz-solutions.spec.ts

/**
 * Quiz 02 — Master Demo Spec
 * Imports and exercises a curated subset of all 20 challenge solutions
 * to prove they compile, are syntactically correct, and demonstrate the concepts.
 */

import { test, expect } from '@playwright/test';
import { openNewTab } from './part-c-write-it/challenge-10-new-tab-handler';
import { waitForD365Spinner } from './part-c-write-it/challenge-11-d365-spinner';
import { fetchTyped } from './part-c-write-it/challenge-12-typed-interface';
import { OrdersPage } from './part-c-write-it/challenge-15-component-split/OrdersPage';

/* ───────────────────────────────────────────────────────────────────────────
   Challenge 1: forEach async trap (sequential for...of)
   ─────────────────────────────────────────────────────────────────────────── */
test('demo ch01: sequential iteration is safe', async ({ page }) => {
  await page.goto('https://demoqa.com/elements');
  const items = ['Text Box', 'Check Box', 'Radio Button'];

  for (const name of items) {
    await page.getByText(name, { exact: false }).first().click();
  }
  expect(items.length).toBe(3);
});

/* ───────────────────────────────────────────────────────────────────────────
   Challenge 2: New tab race condition
   ─────────────────────────────────────────────────────────────────────────── */
test('demo ch02: popup listener before click', async ({ page }) => {
  await page.goto('https://demoqa.com/links');
  const popupPromise = page.waitForEvent('popup', { timeout: 10_000 });

  await page.getByRole('link', { name: 'Home', exact: true }).click();
  const popup = await popupPromise;

  await expect(popup).toHaveURL(/demoqa\.com/);
  await popup.close();
});

/* ───────────────────────────────────────────────────────────────────────────
   Challenge 10: New tab helper
   ─────────────────────────────────────────────────────────────────────────── */
test('demo ch10: helper opens new tab', async ({ page }) => {
  await page.goto('https://demoqa.com/links');
  const { popup } = await openNewTab(
    page,
    page.getByRole('link', { name: 'Home', exact: true })
  );
  await expect(popup.locator('body')).toBeVisible();
  await popup.close();
});

/* ───────────────────────────────────────────────────────────────────────────
   Challenge 11: D365 spinner wait
   ─────────────────────────────────────────────────────────────────────────── */
test('demo ch11: two-phase spinner wait', async ({ page }) => {
  await page.goto('https://example.com');
  await page.setContent(`
    <button id="go">Go</button>
    <div id="spinner" style="display:none">Loading...</div>
    <div id="result"></div>
    <script>
      document.getElementById('go').addEventListener('click', async () => {
        document.getElementById('spinner').style.display = 'block';
        await new Promise(r => setTimeout(r, 500));
        document.getElementById('spinner').style.display = 'none';
        document.getElementById('result').textContent = 'Done';
      });
    </script>
  `);

  await page.locator('#go').click();
  await waitForD365Spinner(page, '#spinner', { timeout: 5_000 });
  await expect(page.locator('#result')).toHaveText('Done');
});

/* ───────────────────────────────────────────────────────────────────────────
   Challenge 12: Typed JSON response
   ─────────────────────────────────────────────────────────────────────────── */
test('demo ch12: typed API response', async ({ request }) => {
  interface Book {
    id: number;
    title: string;
    author: string;
  }
  const book = await fetchTyped<Book>(
    request,
    'https://fakerestapi.azurewebsites.net/api/v1/Books/1'
  );
  expect(book.id).toBe(1);
  expect(typeof book.title).toBe('string');
});

/* ───────────────────────────────────────────────────────────────────────────
   Challenge 13: objectContaining partial assertion
   ─────────────────────────────────────────────────────────────────────────── */
test('demo ch13: partial object match', async ({ page }) => {
  await page.goto('https://example.com');

  const actual = {
    id: 99,
    name: 'Test',
    createdAt: new Date().toISOString(),
    metadata: { version: 3 },
  };

  expect(actual).toEqual(
    expect.objectContaining({
      name: 'Test',
      metadata: expect.objectContaining({ version: expect.any(Number) }),
    })
  );
});

/* ───────────────────────────────────────────────────────────────────────────
   Challenge 15: Component split POM
   ─────────────────────────────────────────────────────────────────────────── */
test('demo ch15: component-split POM is constructable', async ({ page }) => {
  await page.goto('https://example.com');
  await page.setContent(`
    <div data-testid="search-order-id"><input /></div>
    <div data-testid="search-status-dropdown"><select><option>Active</option></select></div>
    <button>Search</button>
    <table data-testid="orders-grid"><tbody></tbody></table>
  `);

  const ordersPage = new OrdersPage(page);
  await ordersPage.searchForm.expectVisible();
  await ordersPage.searchForm.filterByStatus('Active');

  // Since the table is empty, this path exercises the component wiring.
  await ordersPage.resultsGrid.expectVisible();
});

/* ───────────────────────────────────────────────────────────────────────────
   Challenge 16: API mocking trap
   ─────────────────────────────────────────────────────────────────────────── */
test('demo ch16: precise route mocking', async ({ page }) => {
  await page.goto('https://example.com');
  let hit = false;

  await page.route('**/api/health', async (route, request) => {
    if (request.method() !== 'GET') {
      await route.continue();
      return;
    }
    hit = true;
    await route.fulfill({ status: 200, body: '{"status":"ok"}' });
  });

  await page.evaluate(async () => {
    await fetch('/api/health');
  });

  expect(hit).toBe(true);
});

/* ───────────────────────────────────────────────────────────────────────────
   Challenge 19: Avoid nth() anti-pattern
   ─────────────────────────────────────────────────────────────────────────── */
test('demo ch19: semantic selector over nth()', async ({ page }) => {
  await page.goto('https://example.com');
  await page.setContent(`
    <ul>
      <li data-testid="item-a">Alpha</li>
      <li data-testid="item-b">Beta</li>
      <li data-testid="item-c">Gamma</li>
    </ul>
  `);

  // Prefer getByText or data-testid over nth().
  await expect(page.getByText('Beta')).toBeVisible();
  await expect(page.locator('[data-testid="item-c"]')).toHaveText('Gamma');
});

/* ───────────────────────────────────────────────────────────────────────────
   Challenge 20: Dynamic fixture parameters (via test.use pattern)
   ─────────────────────────────────────────────────────────────────────────── */
test.describe('demo ch20: role-based fixture overrides', () => {
  // This describe demonstrates the test.use() pattern conceptually.
  // See challenge-20-dynamic-fixture.ts for the full fixture definition.
  test('overrides baseURL per test block', async ({ page }) => {
    // In a real suite, test.use({ baseURL: 'https://staging.example.com' })
    // would change the baseURL for this block.
    await page.goto('https://example.com');
    await expect(page.locator('body')).toBeVisible();
  });
});
