import type { Page, BrowserContext } from "@playwright/test";

/**
 * Opens a new tab by registering the 'page' event listener BEFORE triggering the action,
 * eliminating the race condition where the new tab event fires before the listener is ready.
 *
 * @param page  — the current Page, used only to access the BrowserContext
 * @param action — the async action that triggers a new tab (e.g. page.click('#open'))
 * @returns the newly opened Page
 */
export async function openTabFrom(
  page: Page,
  action: () => Promise<void>,
): Promise<Page> {
  const context = page.context() as BrowserContext;

  const [newTab] = await Promise.all([context.waitForEvent("page"), action()]);
  return newTab;
}

/**
 * Closes the given tab and asserts it is no longer attached to the context.
 *
 * @param tab — the Page to close
 */
export async function closeTab(tab: Page): Promise<void> {
  await tab.close();
  expect(tab.isClosed()).toBe(true);
}

import { expect } from "@playwright/test";
