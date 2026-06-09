// challenge-10-new-tab-handler.ts

/**
 * Quiz 02 — Challenge 10: New Tab Handler Helper
 * Curriculum: Ch07 — Browser Context & Tabs
 * Difficulty: MEDIUM
 *
 * Problem: Opening links in new tabs is a common workflow, but doing it
 *          race-free requires careful Promise ordering.
 * Solution: A reusable helper that wraps the race-free pattern + validation.
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/* ───────────────────────────────────────────────────────────────────────────
   Helper: Handles click-to-new-tab with zero race conditions
   ─────────────────────────────────────────────────────────────────────────── */

export interface NewTabResult {
  popup: Page;
  originalPage: Page;
}

/**
 * Safely opens a new tab by clicking a trigger element.
 *
 * @param page       - The page containing the trigger
 * @param trigger    - Locator for the element that opens a new tab
 * @param options    - Optional validation config
 * @returns          - Object with popup page and original page references
 */
export async function openNewTab(
  page: Page,
  trigger: Parameters<Page['locator']>[0] | ReturnType<Page['getByRole']>,
  options: {
    expectedUrlPattern?: RegExp;
    waitForLoadState?: 'load' | 'domcontentloaded' | 'networkidle';
    timeout?: number;
  } = {}
): Promise<NewTabResult> {
  const { expectedUrlPattern, waitForLoadState = 'networkidle', timeout = 15_000 } = options;

  // CRITICAL: Start listening BEFORE the click. This eliminates the race.
  const popupPromise = page.waitForEvent('popup', { timeout });

  // The trigger can be a raw selector string or a pre-built Locator.
  if (typeof trigger === 'string') {
    await page.locator(trigger).click();
  } else {
    await trigger.click();
  }

  const popup = await popupPromise;

  // Wait for the new tab to reach a stable load state before returning.
  await popup.waitForLoadState(waitForLoadState);

  // Optional: assert the popup navigated to the expected domain/path.
  if (expectedUrlPattern) {
    await expect(popup).toHaveURL(expectedUrlPattern);
  }

  return { popup, originalPage: page };
}

/* ───────────────────────────────────────────────────────────────────────────
   Demo test using the helper
   ─────────────────────────────────────────────────────────────────────────── */
test('quiz-02-ch10: helper opens new tab and validates URL', async ({ page }) => {
  await page.goto('https://demoqa.com/links');

  const { popup } = await openNewTab(
    page,
    page.getByRole('link', { name: 'Home', exact: true }),
    {
      expectedUrlPattern: /demoqa\.com/,
      waitForLoadState: 'networkidle',
    }
  );

  // Verify the popup is a fully loaded, independent page.
  await expect(popup.locator('body')).toBeVisible();
  expect(popup.url()).toContain('demoqa.com');

  await popup.close();
});

/* ───────────────────────────────────────────────────────────────────────────
   Advanced: Helper that also works with BrowserContext (for multi-context tests)
   ─────────────────────────────────────────────────────────────────────────── */

export async function openNewTabViaContext(
  context: BrowserContext,
  page: Page,
  trigger: ReturnType<Page['locator']>,
  options: {
    expectedUrlPattern?: RegExp;
    waitForLoadState?: 'load' | 'domcontentloaded' | 'networkidle';
  } = {}
): Promise<NewTabResult> {
  const { expectedUrlPattern, waitForLoadState = 'networkidle' } = options;

  // Using context.waitForEvent('page') is an alternative when you don't have
  // a specific originating page reference (e.g., JS window.open from eval).
  const newPagePromise = context.waitForEvent('page');
  await trigger.click();

  const popup = await newPagePromise;
  await popup.waitForLoadState(waitForLoadState);

  if (expectedUrlPattern) {
    await expect(popup).toHaveURL(expectedUrlPattern);
  }

  return { popup, originalPage: page };
}

test('quiz-02-ch10: context-level new tab helper', async ({ page, context }) => {
  await page.goto('https://demoqa.com/links');

  const { popup } = await openNewTabViaContext(
    context,
    page,
    page.getByRole('link', { name: 'Home', exact: true }),
    { expectedUrlPattern: /demoqa\.com/ }
  );

  await expect(popup).toHaveURL(/demoqa\.com/);
  await popup.close();
});

/**
 * DESIGN RATIONALE:
 * - The helper ALWAYS starts the popup listener before the click.
 * - It accepts both string selectors and Locator objects for flexibility.
 * - It validates load state and URL so callers get a guaranteed-ready page.
 * - Returns both popup and originalPage so tests can switch between tabs.
 */
