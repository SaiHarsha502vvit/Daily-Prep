# 50. Real-World SPA Automation — Tabs, Breadcrumbs & MenuItems Without IDs

**Navigation**: [← Previous: Component Testing with Playwright CT](./49_Component_Testing_Playwright_CT.md) | [Index](../../00_MASTER_INDEX.md) | [Next: Login Fixture Architecture →](./51_Login_Fixture_Architecture.md)

**Cross-links:**
- [`Ch02: Enterprise Locators`](../01_Foundations/02_Enterprise_Locators_XPath.md) — Locator hierarchy, `getByRole`, XPath
- [`Ch05: POM Deep Dive`](../02_Core_Architecture/05_POM_Architecture_Deep_Dive.md) — Component POM, lazy eval
- [`Ch10: D365 CRM Testing`](../03_D365_And_Patterns/10_Dynamics365_CRM_Testing.md) — IFrames, menuitem role, two-phase render
- [`Ch17: D365 Advanced Timing`](../03_D365_And_Patterns/17_D365_Advanced_Timing_Patterns.md) — Wait strategy decision table

---

## 5W1H — Why This Chapter?

- **WHAT**: How to automate a complex enterprise SPA — multiple pages, nested tabs, menuitem buttons, breadcrumbs, modals, and zero `id` or `data-testid` attributes. This is the reality of most legacy enterprise apps.
- **WHY**: D365 is one specific platform. But the PATTERNS (tabs, IFrames, two-phase renders, menuitem roles) appear everywhere — SAP Fiori, Salesforce Lightning, Oracle Cloud, ServiceNow, custom Angular/React SPAs built before testability was a requirement.
- **WHO**: SDETs inheriting a brownfield codebase where the dev team won't add IDs. You must survive with what the DOM gives you.
- **WHEN**: After you understand POM (Ch05) and browser internals (Ch08). This is applied architecture, not fundamentals.
- **HOW**: By building a complete POM suite for a fictional enterprise SPA (`AcmeInvoice Portal`) — every locator, every wait strategy, every fixture — from a real-world DOM dump. No IDs allowed.

---

## 1. The Target Application — `AcmeInvoice Portal`

We are automating a real enterprise-style React SPA with these characteristics:

- **URL**: `https://portal.acme.com/invoices`
- **No `id` attributes anywhere**
- **No `data-testid` or `data-automation-key`**
- **Tabs**: `<button role="tab">` with `aria-selected`
- **Menu bar**: `<li role="menuitem">` containing icons + labels
- **Content inside IFrames**: Each tab loads its own `<iframe>`
- **Tables**: `.ag-row` (AG Grid), `.ms-DetailsList-row` (Fluent UI), or generic `<table>`
- **Modals**: Portalled `<div role="dialog">` with a `aria-labelledby` title
- **Spinners**: `.spinner-overlay` or `.loading-shimmer` inside the active tab
- **Toasts**: `<div role="alert">` or `<div role="status">` at `document.body` level

This is NOT D365. But it uses the same DOM patterns.

---

## 2. DOM Reconnaissance — The Console Scripts You Run First

Before writing a single Playwright line, run these in DevTools Console:

```javascript
// 1. Find all tabs and their selected state
[...document.querySelectorAll('[role="tab"]')].map(t => ({
  label: t.textContent.trim(),
  selected: t.getAttribute('aria-selected') === 'true',
  parent: t.closest('[role="tablist"]')?.getAttribute('aria-label'),
}));

// 2. Find all menuitems (not buttons!)
[...document.querySelectorAll('[role="menuitem"]')].map(m => ({
  label: m.textContent.trim(),
  icon: m.querySelector('svg')?.getAttribute('aria-label'),
}));

// 3. Find all iframes and their names
[...document.querySelectorAll('iframe')].map(f => ({
  name: f.name,
  title: f.title,
  src: f.src,
}));

// 4. Find the spinner / loading indicator
document.querySelector('.spinner-overlay, .loading-shimmer, [class*="spinner"]');

// 5. Find toast/alert containers
[...document.querySelectorAll('[role="alert"], [role="status"]')].map(a => ({
  text: a.textContent.trim(),
  className: a.className,
}));
```

**Rule:** If you cannot answer "how many tabs?", "what is the spinner class?", and "where is the iframe?" in under 5 minutes, your POM will be guesswork.

---

## 3. The Master POM — `AcmeInvoicePortal.ts`

```typescript
import { type Page, type Locator, type FrameLocator } from '@playwright/test';

/**
 * ─── PORTAL ORCHESTRATOR ──────────────────────────────────────────────────
 * This is the "front door" POM. Every test starts here.
 * It knows about the shell (header, tabs, menu) but delegates tab content
 * to Component POMs (Component POM pattern from Ch05 + Ch18).
 */
export class AcmeInvoicePortal {
  readonly page: Page;

  // ─── TOP-LEVEL SHELL ────────────────────────────────────────────────────
  readonly header: PortalHeader;
  readonly tabBar: TabBar;
  readonly menuBar: MenuBar;
  readonly toastContainer: ToastContainer;

  // ─── ACTIVE TAB CONTENT ─────────────────────────────────────────────────
  // Each tab content lives in its own iframe. The orchestrator exposes
  // the CURRENTLY ACTIVE iframe's FrameLocator.
  readonly activeTabFrame: FrameLocator;

  constructor(page: Page) {
    this.page = page;
    this.header = new PortalHeader(page);
    this.tabBar = new TabBar(page);
    this.menuBar = new MenuBar(page);
    this.toastContainer = new ToastContainer(page);

    // The active tab's content is ALWAYS inside the first visible iframe
    // (In real apps, you may need to match by name or title.)
    this.activeTabFrame = page.frameLocator('iframe').first();
  }

  /**
   * Navigation: wait for portal to be fully loaded.
   * Use this as the first step after page.goto().
   */
  async waitForReady(): Promise<void> {
    // Wait for header (always present)
    await this.header.companyLogo.waitFor({ state: 'visible' });

    // Wait for tab bar (always present)
    await this.tabBar.root.waitFor({ state: 'visible' });

    // Wait for any initial spinners to finish
    await this.waitForSpinnerToDisappear();
  }

  /**
   * Wait for loading spinner to vanish from the active tab.
   * This is the single most important wait in the entire POM.
   */
  async waitForSpinnerToDisappear(timeout = 30000): Promise<void> {
    // Try multiple spinner selectors — real apps have inconsistent class names
    const spinners = [
      this.activeTabFrame.locator('.spinner-overlay'),
      this.activeTabFrame.locator('.loading-shimmer'),
      this.activeTabFrame.locator('[class*="spinner"]'),
    ];

    // count() on ALL candidate spinners — if any exist, wait for them to disappear
    for (const spinner of spinners) {
      try {
        const count = await spinner.count();
        if (count > 0) {
          await expect(spinner).toHaveCount(0, { timeout });
          return;  // spinner found and gone — done
        }
      } catch {
        // This selector didn't match; try the next one
        continue;
      }
    }

    // No spinner found — either the page loaded instantly or the selector is wrong.
    // This is a silent pass. Log it in debug mode.
  }

  /**
   * Convenience: click a tab by name and wait for it to become active.
   */
  async navigateToTab(tabName: string): Promise<void> {
    await this.tabBar.clickTab(tabName);

    // After tab click, the iframe src changes and the content reloads.
    // We must wait for the spinner to disappear before proceeding.
    await this.waitForSpinnerToDisappear();
  }
}
```

---

## 4. Component POMs — Built from Console Reconnaissance

### 4.1 `PortalHeader.ts`

```typescript
import { type Page, type Locator } from '@playwright/test';

export class PortalHeader {
  readonly page: Page;
  readonly root: Locator;
  readonly companyLogo: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header is the first <header> or a known class
    this.root = page.locator('header').first();

    // Logo: image with alt text
    this.companyLogo = this.root.locator('img[alt="Acme Invoice"]');

    // User menu: button with user icon or name
    this.userMenu = this.root.getByRole('button', { name: /user|account|profile/i });

    // Logout may be inside a dropdown — lazy-loaded
    this.logoutButton = page.getByRole('menuitem', { name: 'Logout' });
  }

  async logout(): Promise<void> {
    await this.userMenu.click();
    await this.logoutButton.click();
  }
}
```

### 4.2 `TabBar.ts`

```typescript
import { type Page, type Locator } from '@playwright/test';

export class TabBar {
  readonly page: Page;
  readonly root: Locator;           // The tablist container
  readonly allTabs: Locator;        // All tab buttons

  constructor(page: Page) {
    this.page = page;

    // TabList container:
    // Strategy: find the element with role="tablist".
    // If multiple exist, scope by parent class or position.
    this.root = page.getByRole('tablist').first();

    // All individual tabs
    this.allTabs = this.root.getByRole('tab');
  }

  /**
   * Click a tab by its visible label.
   * Also verifies the tab becomes selected.
   */
  async clickTab(label: string): Promise<void> {
    const tab = this.root.getByRole('tab', { name: label, exact: true });

    await tab.click();

    // Verify: aria-selected must be "true" after click.
    // This catches "the click did nothing" bugs.
    await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 });
  }

  async getSelectedTabLabel(): Promise<string | null> {
    const selected = this.root.locator('[aria-selected="true"]');
    return selected.textContent();
  }
}
```

### 4.3 `MenuBar.ts`

```typescript
import { type Page, type Locator } from '@playwright/test';

export class MenuBar {
  readonly page: Page;
  readonly root: Locator;

  constructor(page: Page) {
    this.page = page;

    // Menu bar: role="menubar" or a known class
    this.root = page.getByRole('menubar').first();
  }

  /**
   * Click a menuitem by its visible label.
   * CRITICAL: enterprise apps use role="menuitem", NOT "button".
   */
  async clickItem(label: string): Promise<void> {
    const item = this.root.getByRole('menuitem', { name: label, exact: true });
    await item.click();
  }

  /**
   * Click a submenu item that appears after hovering/clicking a parent.
   */
  async clickSubMenu(parentLabel: string, childLabel: string): Promise<void> {
    const parent = this.root.getByRole('menuitem', { name: parentLabel });
    await parent.click();

    // Submenu often appears in a floating panel outside the menubar
    const submenu = this.page.getByRole('menu').last();
    const child = submenu.getByRole('menuitem', { name: childLabel });
    await child.click();
  }
}
```

### 4.4 `ToastContainer.ts`

```typescript
import { type Page, type Locator } from '@playwright/test';

export class ToastContainer {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Wait for a toast with specific text to appear, then return its content.
   */
  async waitForToast(textPattern: RegExp | string, timeout = 10_000): Promise<string> {
    const toast = this.page.getByRole('alert').filter({ hasText: textPattern });
    await toast.waitFor({ state: 'visible', timeout });
    const text = await toast.textContent();
    return text ?? '';
  }

  async getAllActiveToasts(): Promise<string[]> {
    const toasts = this.page.getByRole('alert');
    const count = await toasts.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const t = await toasts.nth(i).textContent();
      if (t) texts.push(t.trim());
    }
    return texts;
  }
}
```

---

## 5. Tab Content POMs — The IFrame Boundary

Each tab's content lives in an iframe. The POM for a tab receives a `FrameLocator`, NOT a `Page`.

```typescript
import { type FrameLocator, type Locator } from '@playwright/test';

/**
 * POM for the "Invoices" tab content.
 * All locators are scoped to the iframe.
 */
export class InvoiceTabContent {
  readonly frame: FrameLocator;
  readonly searchField: Locator;
  readonly resultsTable: Locator;
  readonly rows: Locator;
  readonly noResultsMessage: Locator;
  readonly payButton: Locator;

  constructor(frame: FrameLocator) {
    this.frame = frame;

    // Search: getByPlaceholder works even without IDs
    this.searchField = frame.getByPlaceholder(/search invoices/i);

    // Results: AG Grid row selector (real-world class)
    this.resultsTable = frame.locator('.ag-center-cols-viewport');
    this.rows = frame.locator('.ag-row');

    // Alternative for generic tables:
    // this.rows = frame.locator('table tbody tr');

    // "No results" text — useful for negative assertions
    this.noResultsMessage = frame.getByText(/no (invoices|records|results) found/i);

    // Pay button inside a row — scoped to a specific row later
    this.payButton = frame.getByRole('button', { name: 'Pay' });
  }

  async searchForInvoice(query: string): Promise<void> {
    await this.searchField.fill(query);
    // The search may trigger an API call. Wait for results.
    await this.frame.waitForResponse(resp =>
      resp.url().includes('/api/invoices') && resp.status() === 200
    );

    // Wait for spinner inside the iframe
    const spinner = this.frame.locator('.spinner-overlay');
    const count = await spinner.count();
    if (count > 0) {
      await expect(spinner).toHaveCount(0, { timeout: 15_000 });
    }
  }

  async getRowCount(): Promise<number> {
    return this.rows.count();
  }

  async payInvoiceInRow(rowIndex: number): Promise<void> {
    const row = this.rows.nth(rowIndex);
    const payBtn = row.locator('[role="button"]').filter({ hasText: 'Pay' });
    await payBtn.click();
  }
}
```

---

## 6. Custom Fixtures — `invoicePortal.fixture.ts`

```typescript
import { test as base } from '@playwright/test';
import { AcmeInvoicePortal } from '../pages/AcmeInvoicePortal';
import { InvoiceTabContent } from '../pages/InvoiceTabContent';

/**
 * ─── CUSTOM FIXTURES ──────────────────────────────────────────────────────
 * These fixtures give every test a fully initialised portal POM suite
 * and navigates to the correct tab content automatically.
 */

interface InvoicePortalFixtures {
  portal: AcmeInvoicePortal;        // The orchestrator POM
  invoiceTab: InvoiceTabContent;     // Direct access to invoice tab
}

export const test = base.extend<InvoicePortalFixtures>({
  /**
   * portal: creates the orchestrator and waits for the app to be ready.
   */
  portal: async ({ page }, use) => {
    const portal = new AcmeInvoicePortal(page);
    await portal.waitForReady();
    await use(portal);
  },

  /**
   * invoiceTab: navigates to the Invoices tab and returns the tab content POM.
   * Requires `portal` fixture (dependency injection).
   */
  invoiceTab: async ({ portal }, use) => {
    await portal.navigateToTab('Invoices');
    const tabContent = new InvoiceTabContent(portal.activeTabFrame);
    await use(tabContent);
  },
});
```

### The Test That Uses These Fixtures

```typescript
import { test, expect } from '../../fixtures/invoicePortal.fixture';

test('search for invoice and verify results', async ({ invoiceTab, portal }) => {
  //invoiceTab fixture already navigated to Invoices tab

  await invoiceTab.searchForInvoice('INV-2024-001');

  // Assert: at least one row appears
  await expect(invoiceTab.rows.first()).toBeVisible();

  // Assert: row count is correct
  const count = await invoiceTab.getRowCount();
  expect(count).toBeGreaterThan(0);

  // Assert: no "no results" message
  await expect(invoiceTab.noResultsMessage).not.toBeVisible();

  // Assert: a toast confirms the search
  await expect(
    portal.toastContainer.waitForToast(/showing \d+ results/)
  ).resolves.toMatch(/showing \d+ results/);
});
```

---

## 7. The "No IDs" Strategy Summary

When your app has ZERO testability hooks, this is your priority list:

| Priority | Selector Strategy | Example | Stability |
|---|---|---|---|
| 1 | ARIA role + accessible name | `getByRole('tab', { name: 'Invoices' })` | High |
| 2 | Placeholder text (for inputs) | `getByPlaceholder('Search invoices')` | Medium |
| 3 | Structural position + role | `locator('header').first().getByRole('button')` | Medium |
| 4 | Text content (fuzzy) | `getByText(/no results found/i)` | Low-Medium |
| 5 | CSS class (last resort) | `locator('.ag-row')` | Low |
| 6 | XPath with text | `xpath=//button[contains(.,'Pay')]` | Fragile |
| 7 | Indexing (`.nth()`) | `locator('button').nth(2)` | Very fragile |

**Enterprise rule:** If you are forced to use `.nth()` or raw CSS classes, open a ticket with the dev team. Frame it as an accessibility issue — `aria-label` and `role` help screen readers too.

---

## 8. Real-World Situations from the Wild

### Situation A: Salesforce Lightning
Salesforce uses Shadow DOM heavily. Playwright piercing handles it natively:
```typescript
// Playwright pierces shadow DOM automatically — no special API needed
await page.locator('lightning-input input').fill('text');
```

### Situation B: SAP Fiori
Fiori uses `sap.m.` controls with generated IDs. Use the `data-sap-ui` attribute:
```typescript
await page.locator('[data-sap-ui="createButton"]').click();
```

### Situation C: ServiceNow
ServiceNow forms are inside iframes with dynamic `gsft_main` names:
```typescript
const frame = page.frameLocator('iframe[name="gsft_main"]');
await frame.getByLabel('Short description').fill('Test incident');
```

---

## Navigation

**Previous:** [← Component Testing with Playwright CT](./49_Component_Testing_Playwright_CT.md)
**Next:** [Login Fixture Architecture →](./51_Login_Fixture_Architecture.md)
