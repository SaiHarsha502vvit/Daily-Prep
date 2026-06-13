import { type Locator, type Page } from '@playwright/test';
import { Timeouts } from '../../../constants/timeouts';

export interface ActionOptions {
  description: string;
  timeout?: number;
}

/**
 * Wraps locator.click() with visibility wait and action logging.
 * Enforces Law 4: no raw .click() in specs or POMs.
 */
export async function clickElement(locator: Locator, options: ActionOptions): Promise<void> {
  const timeout = options.timeout ?? Timeouts.FIFTEEN_SECONDS;
  await locator.waitFor({ state: 'visible', timeout });
  await locator.click({ timeout });
  if (process.env.LOG_ACTIONS === 'true') {
    console.log(`[click] ${options.description}`);
  }
}

/**
 * Wraps locator.fill() with visibility wait and action logging.
 * Enforces Law 4: no raw .fill() in specs or POMs.
 */
export async function fillInput(
  locator: Locator,
  value: string,
  options: ActionOptions
): Promise<void> {
  const timeout = options.timeout ?? Timeouts.FIFTEEN_SECONDS;
  await locator.waitFor({ state: 'visible', timeout });
  await locator.fill(value, { timeout });
  if (process.env.LOG_ACTIONS === 'true') {
    console.log(`[fill]  ${options.description} = "${value}"`);
  }
}

/**
 * Navigates to a URL and waits for domcontentloaded.
 */
export async function safeNavigate(
  page: Page,
  url: string,
  description: string,
  timeout = Timeouts.THIRTY_SECONDS
): Promise<void> {
  if (process.env.LOG_ACTIONS === 'true') {
    console.log(`[goto]  ${description} → ${url}`);
  }
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
}