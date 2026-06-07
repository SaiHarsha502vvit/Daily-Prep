# 47. File Uploads, Downloads & Media Handling

**Navigation**: [← Previous: Playwright Config Deep-Dive](./46_Playwright_Config_Deep_Dive.md) | [Index](../../00_MASTER_INDEX.md) | [Next: Trace Viewer & Video →](./48_Trace_Viewer_Video_Mastery.md)

**Cross-links:**
- [`Ch07: E2E Test Architecture`](../02_Core_Architecture/07_test_step_E2E_Architecture.md) — Step naming, data accumulator
- [`Ch31: API Mocking`](./31_API_Mocking_page_route.md) — `page.route()` for media interception
- [`Ch17: D365 Advanced Timing`](../03_D365_And_Patterns/17_D365_Advanced_Timing_Patterns.md) — Wait strategies for file dialogs

---

## 5W1H — Why This Chapter?

- **WHAT**: How to automate file uploads, file downloads, drag-and-drop, and clipboard operations in Playwright — plus how to assert on the resulting files.
- **WHY**: Upload/download flows are everywhere (invoices, receipts, CSV exports, profile pictures), yet they are among the most brittle test areas because engineers guess at the API or use `page.evaluate()` hacks.
- **WHO**: SDETs building E2E flows that include document management, bulk imports, or export verification.
- **WHEN**: After you can write a basic `page.click()` test. This needs no advanced architecture — just the correct API.
- **HOW**: By showing the exact Playwright API for each media operation, the common race conditions, and assertion patterns for file verification.

---

## 1. File Uploads — `setInputFiles()`

The HTML file input is `<input type="file">`. Playwright can populate it directly — **no clicking the upload button required**.

```typescript
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('upload a single file', async ({ page }) => {
  await page.goto('/profile');

  // The input is often hidden. Playwright finds it anyway if it's in the DOM.
  const fileInput = page.locator('input[type="file"]');

  // Provide the absolute path to the file.
  await fileInput.setInputFiles(
    path.join(__dirname, '../test-data/avatars/profile-photo.png')
  );

  // Assert: upload success message appears
  await expect(page.getByText('Avatar updated')).toBeVisible();
});
```

### Multiple Files

```typescript
test('bulk upload invoices', async ({ page }) => {
  const fileInput = page.locator('input[type="file"][multiple]');

  await fileInput.setInputFiles([
    path.join(__dirname, '../test-data/invoices/inv-001.pdf'),
    path.join(__dirname, '../test-data/invoices/inv-002.pdf'),
    path.join(__dirname, '../test-data/invoices/inv-003.pdf'),
  ]);

  // Assert: 3 files appear in the upload list
  await expect(page.locator('.upload-list-item')).toHaveCount(3);
});
```

### Dynamic File Content (Buffer Upload)

Sometimes you want to upload a file generated DURING the test (e.g., a CSV with random data).

```typescript
import { test } from '@playwright/test';

test('upload dynamically generated CSV', async ({ page }) => {
  const csvContent = `id,name,amount\n1,Alice,100\n2,Bob,200`;

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'report.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvContent),
  });

  await expect(page.getByText('3 rows imported')).toBeVisible();
});
```

### The Hidden Input Trap

```typescript
// ❌ Wrong: clicking the visible button does nothing for uploads
await page.getByRole('button', { name: 'Upload' }).click();
// The actual upload happens when the <input type="file"> receives files.

// ✅ Correct: target the hidden input directly
await page.locator('input[type="file"]').setInputFiles('/path/to/file.pdf');
```

**Why:** The visible "Upload" button typically triggers a click on the hidden `<input type="file">`. Playwright bypasses the UI entirely by talking to the input element directly via CDP.

---

## 2. File Downloads — The `download` Event

File downloads in browsers trigger a native save dialog. Playwright intercepts this via the `download` event.

```typescript
test('download an invoice PDF', async ({ page }) => {
  await page.goto('/invoices');

  // Set up the download listener FIRST (same pattern as new-tab)
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download Invoice' }).click(),
  ]);

  // Save to a path (optional — if omitted, file is in temp and deleted)
  const downloadPath = path.join(__dirname, '../downloads', download.suggestedFilename());
  await download.saveAs(downloadPath);

  // Assert: file exists and has content
  expect(fs.existsSync(downloadPath)).toBe(true);
  const stats = fs.statSync(downloadPath);
  expect(stats.size).toBeGreaterThan(0);

  // Optional: assert on file name
  expect(download.suggestedFilename()).toMatch(/invoice-\d+\.pdf/);
});
```

### Download with Dynamic Filename

```typescript
test('download and parse CSV report', async ({ page }) => {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export CSV' }).click(),
  ]);

  // Read directly into memory without saving to disk
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const csvText = Buffer.concat(chunks).toString('utf-8');

  // Parse and assert
  const rows = csvText.trim().split('\n');
  expect(rows.length).toBeGreaterThan(1);  // header + at least 1 data row
  expect(rows[0]).toBe('id,name,status');
});
```

### The "Download Never Fires" Trap

```typescript
// ❌ Wrong: waitForEvent('download') listener registered AFTER click
await page.getByRole('button', { name: 'Export' }).click();
const download = await page.waitForEvent('download');  // RACE CONDITION

// ✅ Correct: Promise.all with listener FIRST
const [download] = await Promise.all([
  page.waitForEvent('download'),  // listener registered
  page.getByRole('button', { name: 'Export' }).click(),
]);
```

---

## 3. Drag-and-Drop

Playwright supports drag-and-drop natively via `dragTo()`.

```typescript
test('drag invoice to archive folder', async ({ page }) => {
  await page.goto('/documents');

  const invoiceCard = page.locator('[data-testid="invoice-card"]').first();
  const archiveZone = page.locator('[data-testid="archive-drop-zone"]');

  await invoiceCard.dragTo(archiveZone);

  await expect(page.getByText('Moved to Archive')).toBeVisible();
});
```

### Drag-and-Drop with File Upload (Native Desktop Drop)

Some apps accept files dropped from the desktop onto the browser. Playwright simulates this with `dataTransfer`:

```typescript
test('drop file onto upload zone', async ({ page }) => {
  await page.goto('/upload');

  const dropZone = page.locator('[data-testid="drop-zone"]');

  // Create a DataTransfer object with files
  await dropZone.evaluate((el, filePaths) => {
    const dataTransfer = new DataTransfer();

    filePaths.forEach((fp: string) => {
      // In real tests, you'd read the file as a File object
      // This example assumes the app accepts the drop event itself
      const file = new File(['mock content'], fp, { type: 'application/pdf' });
      dataTransfer.items.add(file);
    });

    el.dispatchEvent(new DragEvent('drop', { dataTransfer }));
  }, ['invoice-001.pdf', 'invoice-002.pdf']);

  await expect(page.locator('.uploaded-file')).toHaveCount(2);
});
```

---

## 4. Clipboard Operations

Playwright can read from and write to the system clipboard (requires permissions).

```typescript
import { test, expect } from '@playwright/test';

test('copy-and-paste citation ID', async ({ page, context }) => {
  // Grant clipboard permissions
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  await page.goto('/citations/CIT-001');

  // Click the "Copy ID" button
  await page.getByRole('button', { name: 'Copy ID' }).click();

  // Read from clipboard
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toBe('CIT-001');

  // Paste into search field
  await page.getByRole('textbox', { name: 'Search' }).click();
  await page.keyboard.press('Control+v');  // or Meta+v on Mac

  await expect(page.getByRole('textbox', { name: 'Search' })).toHaveValue('CIT-001');
});
```

**Headless trap:** Clipboard permissions are sometimes denied in headless mode. Use `--headed` or CI environments with clipboard support.

---

## 5. Asserting on File Content

### CSV Assertions

```typescript
import { parse } from 'csv-parse/sync';  // npm install csv-parse

test('exported CSV has correct columns', async ({ page }) => {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export' }).click(),
  ]);

  const buffer = await download.createReadStream();
  const content = (await bufferToString(buffer)).trim();

  const records = parse(content, { columns: true, skip_empty_lines: true });

  expect(records.length).toBe(3);
  expect(records[0]).toMatchObject({
    id: '1',
    name: 'Alice',
    status: 'PAID',
  });
});
```

### PDF Assertions (Lightweight)

Playwright cannot natively parse PDFs. Use a lightweight approach:

```typescript
test('downloaded PDF contains expected text', async ({ page }) => {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download Report' }).click(),
  ]);

  const path = `/tmp/${download.suggestedFilename()}`;
  await download.saveAs(path);

  // Use pdf-parse for content extraction (npm install pdf-parse)
  const pdfParse = await import('pdf-parse');
  const buffer = fs.readFileSync(path);
  const data = await pdfParse.default(buffer);

  expect(data.text).toContain('Invoice #INV-2024-001');
  expect(data.numpages).toBe(2);
});
```

---

## 6. Cleanup Pattern for Downloads

```typescript
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const downloadsDir = path.join(__dirname, '../downloads');

test.afterEach(() => {
  // Clean up download folder between tests
  if (fs.existsSync(downloadsDir)) {
    fs.readdirSync(downloadsDir).forEach((file) => {
      fs.unlinkSync(path.join(downloadsDir, file));
    });
  }
});

test('download and verify', async ({ page }) => {
  // ... download logic ...
});
```

---

## Quick Reference

| Operation | API | Key Trap |
|---|---|---|
| Upload single | `setInputFiles('/path')` | Target `input[type=file]`, not the button |
| Upload multiple | `setInputFiles(['/a', '/b'])` | Input needs `[multiple]` attribute |
| Upload buffer | `setInputFiles({ name, mimeType, buffer })` | Buffer must be a `Buffer` instance |
| Download | `Promise.all([waitForEvent('download'), click])` | Listener must be first |
| Read download | `download.createReadStream()` | Stream is consumed once |
| Drag-to-drop | `locator.dragTo(target)` | Works for native DnD only |
| Custom DnD | `evaluate()` + `DataTransfer` | Needed for complex drop zones |
| Clipboard | `context.grantPermissions()` + `navigator.clipboard` | Headless may deny permissions |

---

## Navigation

**Previous:** [← Playwright Config Deep-Dive](./46_Playwright_Config_Deep_Dive.md)
**Next:** [Trace Viewer & Video Recording →](./48_Trace_Viewer_Video_Mastery.md)
