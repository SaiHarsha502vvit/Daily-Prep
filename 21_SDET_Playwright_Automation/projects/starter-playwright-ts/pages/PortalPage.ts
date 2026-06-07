import { type Page, type Locator, type FrameLocator } from '@playwright/test';

/**
 * ─── PORTAL ORCHESTRATOR ──────────────────────────────────────────────────
 * Demonstrates the Component POM pattern from Ch50.
 * Orchestrates TabBar, MenuBar, ToastContainer, and iframe-bound content.
 */
export class PortalPage {
  readonly page: Page;
  readonly tabBar: TabBar;
  readonly menuBar: MenuBar;
  readonly toastContainer: ToastContainer;
  readonly activeTabFrame: FrameLocator;

  constructor(page: Page) {
    this.page = page;
    this.tabBar = new TabBar(page);
    this.menuBar = new MenuBar(page);
    this.toastContainer = new ToastContainer(page);
    // Each tab loads its own iframe
    this.activeTabFrame = page.frameLocator('iframe').first();
  }

  async waitForReady(): Promise<void> {
    await this.tabBar.root.waitFor({ state: 'visible' });
    await this.waitForSpinnerToDisappear();
  }

  async waitForSpinnerToDisappear(timeout = 30_000): Promise<void> {
    const spinners = [
      this.activeTabFrame.locator('.spinner-overlay'),
      this.activeTabFrame.locator('.loading-shimmer'),
      this.activeTabFrame.locator('[class*="spinner"]'),
    ];

    for (const spinner of spinners) {
      try {
        const count = await spinner.count();
        if (count > 0) {
          await expect(spinner).toHaveCount(0, { timeout });
          return;
        }
      } catch {
        continue;
      }
    }
  }

  async navigateToTab(label: string): Promise<void> {
    await this.tabBar.clickTab(label);
    await this.waitForSpinnerToDisappear();
  }
}

class TabBar {
  readonly root: Locator;
  readonly allTabs: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('tablist').first();
    this.allTabs = this.root.getByRole('tab');
  }

  async clickTab(label: string): Promise<void> {
    const tab = this.root.getByRole('tab', { name: label, exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 });
  }
}

class MenuBar {
  readonly root: Locator;
  constructor(page: Page) {
    this.root = page.getByRole('menubar').first();
  }
  async clickItem(label: string): Promise<void> {
    await this.root.getByRole('menuitem', { name: label, exact: true }).click();
  }
}

class ToastContainer {
  private page: Page;
  constructor(page: Page) { this.page = page; }

  async waitForToast(pattern: RegExp | string, timeout = 10_000): Promise<string> {
    const toast = this.page.getByRole('alert').filter({ hasText: pattern });
    await toast.waitFor({ state: 'visible', timeout });
    return (await toast.textContent()) ?? '';
  }
}

import { expect } from '@playwright/test';
