import { type Locator, type Page } from '@playwright/test';

import { Timeouts } from '../../constants/timeouts';

export interface ActionOptions {
  description: string;
  timeout?: number;
}

export async function clickElement(locator: Locator, options: ActionOptions): Promise<void> {
  const timeout = options.timeout ?? Timeouts.FIFTEEN_SECONDS;
  await locator.waitFor({ state: 'visible', timeout });
  await locator.click({ timeout });
  if (process.env.LOG_ACTIONS === 'true') {
    console.log(`[click] ${options.description}`);
  }
}

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

export async function selectOption(
  locator: Locator,
  value: string,
  options: ActionOptions
): Promise<void> {
  const timeout = options.timeout ?? Timeouts.FIFTEEN_SECONDS;
  await locator.waitFor({ state: 'visible', timeout });
  await locator.selectOption(value, { timeout });
}

export async function waitForVisible(
  locator: Locator,
  options: ActionOptions
): Promise<void> {
  const timeout = options.timeout ?? Timeouts.FIFTEEN_SECONDS;
  await locator.waitFor({ state: 'visible', timeout });
}

export async function isVisibleSafe(locator: Locator, timeoutMs = Timeouts.FIVE_SECONDS): Promise<boolean> {
  return locator
    .waitFor({ state: 'visible', timeout: timeoutMs })
    .then(() => true)
    .catch(() => false);
}

export async function safeNavigate(
  page: Page,
  url: string,
  description: string,
  timeout = Timeouts.THIRTY_SECONDS
): Promise<void> {
  if (process.env.LOG_ACTIONS === 'true') console.log(`[goto]  ${description} → ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
}
