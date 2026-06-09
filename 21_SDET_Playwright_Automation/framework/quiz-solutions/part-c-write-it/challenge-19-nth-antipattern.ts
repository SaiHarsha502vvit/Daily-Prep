// challenge-19-nth-antipattern.ts

/**
 * Quiz 02 — Challenge 19: Locator nth() Anti-Pattern
 * Curriculum: Ch06 — Waits & Synchronization
 * Difficulty: MEDIUM
 *
 * Problem: Using locator.nth(index) creates tests that break when:
 *          - A new row/item is added before the target
 *          - Sort order changes
 *          - The list is filtered dynamically
 * Solution: Use semantic selectors (role + accessible name, data-testid) or
 *           filter by text/content instead of positional index.
 */

import { test, expect, type Locator, type Page } from '@playwright/test';

/* ───────────────────────────────────────────────────────────────────────────
   ❌ BROKEN VERSION — nth() is brittle
   ─────────────────────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function deleteThirdUserBroken(page: Page): Promise<void> {
  // TRAP: If a new user is added, or the list is sorted differently,
  // the "3rd" row is no longer the user we intended to delete.
  const deleteBtn = page.locator('table tbody tr').nth(2).locator('button:has-text("Delete")');
  await deleteBtn.click(); // 🐛 Might delete the wrong user!
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function selectSecondTabBroken(page: Page): Promise<void> {
  // TRAP: If marketing adds a new tab, index 1 shifts.
  const tab = page.locator('.nav-tab').nth(1);
  await tab.click(); // 🐛 May click a completely different tab.
}

/* ───────────────────────────────────────────────────────────────────────────
   ✅ FIXED VERSION — semantic selectors are stable
   ─────────────────────────────────────────────────────────────────────────── */

async function deleteUserByName(page: Page, userName: string): Promise<void> {
  // FIXED: Find the row by the user's NAME, not by row index.
  const row = page.locator('table tbody tr').filter({ hasText: userName });
  const deleteBtn = row.getByRole('button', { name: 'Delete' });

  await deleteBtn.click(); // ✅ Always targets the correct user's row.
}

async function selectTabByLabel(page: Page, label: string): Promise<void> {
  // FIXED: Use role + accessible name. Stable regardless of tab order.
  const tab = page.getByRole('tab', { name: label, exact: true });
  await tab.click(); // ✅ Correct even if new tabs are added.
}

/* ───────────────────────────────────────────────────────────────────────────
   Demo test: nth() vs semantic on a mocked table
   ─────────────────────────────────────────────────────────────────────────── */

test('quiz-02-ch19: nth() breaks when list order changes', async ({ page }) => {
  // Inject a table where row order is dynamic.
  await page.goto('https://example.com');
  await page.setContent(`
    <table>
      <tbody>
        <tr><td>Alice</td><td><button data-user="alice">Delete</button></td></tr>
        <tr><td>Bob</td><td><button data-user="bob">Delete</button></td></tr>
        <tr><td>Charlie</td><td><button data-user="charlie">Delete</button></td></tr>
      </tbody>
    </table>
  `);

  const rows = page.locator('table tbody tr');

  // nth(1) gives us Bob currently.
  const secondRowNth = rows.nth(1).locator('button');
  await expect(secondRowNth).toHaveAttribute('data-user', 'bob');

  // Now simulate a new user (David) being inserted before Bob.
  await page.evaluate(() => {
    const tbody = document.querySelector('tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = '<td>David</td><td><button data-user="david">Delete</button></td>';
    tbody?.insertBefore(newRow, tbody.children[1]!);
  });

  // nth(1) now gives us David, NOT Bob. The test would break if it relied on nth().
  await expect(rows.nth(1).locator('button')).toHaveAttribute('data-user', 'david');

  // BUT semantic selection still finds Bob correctly.
  const bobRow = rows.filter({ hasText: 'Bob' });
  await expect(bobRow.locator('button')).toHaveAttribute('data-user', 'bob');
});

/* ───────────────────────────────────────────────────────────────────────────
   Advanced: using data-testid as a stable anchor
   ─────────────────────────────────────────────────────────────────────────── */

export async function findRowByTestId(page: Page, testId: string): Promise<Locator> {
  // data-testid is the most stable selector because it's explicitly added
  // by developers for testing and won't change with UI redesigns.
  return page.locator(`[data-testid="${testId}"]`);
}

test('quiz-02-ch19: data-testid is the most stable selector', async ({ page }) => {
  await page.goto('https://example.com');
  await page.setContent(`
    <ul>
      <li data-testid="item-apple">Apple</li>
      <li data-testid="item-banana">Banana</li>
      <li data-testid="item-cherry">Cherry</li>
    </ul>
  `);

  const cherry = await findRowByTestId(page, 'item-cherry');
  await expect(cherry).toHaveText('Cherry');

  // Even if we reorder the list in the DOM, data-testid stays correct.
  await page.evaluate(() => {
    const ul = document.querySelector('ul');
    ul?.prepend(ul.children[2]!); // Move Cherry to first position
  });

  await expect(cherry).toHaveText('Cherry'); // ✅ Still correct.
});

/* ───────────────────────────────────────────────────────────────────────────
   When nth() IS acceptable (rare but valid cases)
   ─────────────────────────────────────────────────────────────────────────── */

test('quiz-02-ch19: nth() is ok for fixed-layout structures', async ({ page }) => {
  await page.goto('https://example.com');

  // Breadcrumbs, wizard steps, calendar cells — these have fixed semantic meaning
  // tied to their position. Even then, prefer semantic if possible.
  // e.g., page.getByLabel('Step 2 of 5') > page.locator('.step').nth(1)

  // If you MUST use nth(), document WHY and add a comment.
  // Example: a 3-column layout where column positions are contractually fixed.
  const columns = page.locator('.layout-column');
  const middleColumn = columns.nth(1);
  void middleColumn; // placeholder
  expect(true).toBe(true);
});

/**
 * SELECTOR ROBUSTNESS RANKING (best → worst):
 * 1. getByRole(role, { name })     — user-centric, survives redesigns
 * * 2. getByLabel / getByPlaceholder — form-specific semantic
 * 3. getByText / getByTestId        — explicit or content-based
 * 4. CSS with class + structure     — brittle to redesign
 * 5. XPath                          — hard to read, brittle
 * 6. nth(index)                     — breaks on any list mutation
 *
 * EXCEPTION: Calendar grids, fixed multi-column layouts, and tables with
 * known sort orders MAY use nth() if documented.
 */
