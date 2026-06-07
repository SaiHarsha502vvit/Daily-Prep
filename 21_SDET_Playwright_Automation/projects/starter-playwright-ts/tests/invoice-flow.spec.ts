import { test, expect } from '../../fixtures/auth.fixture';
import { PortalPage } from '../../pages/PortalPage';
import { InvoiceTabContent } from '../../pages/InvoiceTabContent';

/**
 * ─── INVOICE SEARCH & VERIFY ───────────────────────────────────────────────
 * Demonstrates Ch50 (SPA POMs) + Ch07 (Data Accumulator) + Ch42 (polling)
 */

interface TestData {
  invoiceId: string | null;
  customerId: string | null;
}

test('search invoice and verify results', async ({ adminPage }) => {
  const portal = new PortalPage(adminPage);
  const data: TestData = { invoiceId: null, customerId: null };

  await test.step('1. Wait for portal to be ready', async () => {
    await portal.waitForReady();
  });

  await test.step('2. Navigate to Invoices tab', async () => {
    await portal.navigateToTab('Invoices');
  });

  const invoiceTab = new InvoiceTabContent(portal.activeTabFrame);

  await test.step('3. Search for customer', async () => {
    await invoiceTab.searchForInvoice('Alice Corp');
  });

  await test.step('4. Verify results are visible', async () => {
    await expect(invoiceTab.rows.first()).toBeVisible();
    const count = await invoiceTab.getRowCount();
    expect(count).toBeGreaterThan(0);
    await expect(invoiceTab.noResultsMessage).not.toBeVisible();
  });

  await test.step('5. Extract invoice ID from first row', async () => {
    data.invoiceId = await invoiceTab.rows.first()
      .locator('[data-column="id"]')
      .textContent()
      .then(t => t?.trim() ?? '');

    expect(data.invoiceId).toMatch(/INV-\d+/);
  });

  await test.step('6. Verify toast confirmation', async () => {
    const toastText = await portal.toastContainer.waitForToast(/showing \d+ results/);
    expect(toastText).toMatch(/showing \d+ results/);
  });
});

test('upload and verify invoice PDF', async ({ adminPage }) => {
  // Ch47 pattern: file upload with buffer
  await adminPage.goto('/invoices/upload');

  const csvContent = `id,name,amount\n1,Alice,100\n2,Bob,200`;
  await adminPage.locator('input[type="file"]').setInputFiles({
    name: 'invoices.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvContent),
  });

  await expect(adminPage.getByText('2 rows imported')).toBeVisible();
});

test('download invoice report', async ({ adminPage }) => {
  // Ch47 pattern: file download
  await adminPage.goto('/invoices');

  const [download] = await Promise.all([
    adminPage.waitForEvent('download'),
    adminPage.getByRole('button', { name: 'Export CSV' }).click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/report-\d+\.csv/);
  const path = `/tmp/${download.suggestedFilename()}`;
  await download.saveAs(path);
  expect(require('fs').existsSync(path)).toBe(true);
});
