import type { Page, PageScreenshotOptions } from '@playwright/test';

import { VISUAL_CONFIG } from './config';

/**
 * Hides dynamic elements that change per run (timestamps, dates, etc.)
 * before screenshot capture to ensure consistent baseline comparisons.
 *
 * @param page - Playwright page instance
 */
export async function maskDynamicElements(page: Page): Promise<void> {
  await page.evaluate((selectors: string[]) => {
    selectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        (el as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
        (el as HTMLElement).style.setProperty('display', 'none', 'important');
      });
    });
  }, VISUAL_CONFIG.maskRegions);
}

/**
 * Builds a merged screenshot-options object that applies VISUAL_CONFIG defaults
 * (maxDiffPixels, animations disabled) on top of any per-call overrides.
 *
 * Use it with the native Playwright matcher:
 *   const opts = buildScreenshotOptions({ maxDiffPixels: 50 });
 *   await expect(page).toHaveScreenshot('login.png', opts);
 */
export function buildScreenshotOptions(
  overrides?: PageScreenshotOptions,
): PageScreenshotOptions {
  return {
    animations: 'disabled',
    ...overrides,
  };
}
