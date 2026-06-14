import { type Locator } from "@playwright/test";

export interface ActionOptions {
  description: string;
  timeout?: number;
}

export async function clickElement(
  locator: Locator,
  options: ActionOptions,
): Promise<void> {
  await locator.waitFor({ state: "visible", timeout: options.timeout });
  await locator.click({ timeout: options.timeout });
  if (process.env.LOG_ACTIONS === "true") {
    console.log(`[ACTION] click: ${options.description}`);
  }
}

export async function fillInput(
  locator: Locator,
  value: string,
  options: ActionOptions,
): Promise<void> {
  await locator.waitFor({ state: "visible", timeout: options.timeout });
  await locator.fill(value, { timeout: options.timeout });
  if (process.env.LOG_ACTIONS === "true") {
    console.log(`[ACTION] fill: ${options.description}`);
  }
}
