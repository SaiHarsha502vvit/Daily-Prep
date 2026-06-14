import { test, expect, type Page } from "@playwright/test";
import { WindowsPage } from "../../../websites/the-internet/pages/WindowsPage";
import { NewWindowPage } from "../../../websites/the-internet/pages/NewWindowPage";
import { closeTab } from "../../../utilities/browser/tab-manager";

const BASE_URL = "https://the-internet.herokuapp.com/windows";

test.describe("New Tab Flow", { tag: ["@regression"] }, () => {
  let windowsPage: WindowsPage;

  test.beforeEach(({ page }: { page: Page }) => {
    windowsPage = new WindowsPage(page);
  });

  test("opens new tab, validates heading, returns to original", async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto(BASE_URL);

    // Act — open the new tab using the race-condition-safe helper
    const newTab = await windowsPage.clickOpenWindowLink();

    // Assert — new tab content loaded
    const newWindowPage = new NewWindowPage(newTab);
    await newWindowPage.expectLoaded();

    // Act — switch back to the original tab
    await page.bringToFront();

    // Assert — original tab is still interactive
    await expect(page.locator("h3")).toContainText("Opening a New Window");

    // Teardown — close the new tab to prevent memory build-up in parallel workers
    await closeTab(newTab);
  });

  test.afterEach(async ({ page }: { page: Page }) => {
    // Safety net: close any extra tabs that may have been left open
    const context = page.context();
    const allPages = context.pages();
    if (allPages.length > 1) {
      await closeTab(allPages[1]);
    }
  });
});
