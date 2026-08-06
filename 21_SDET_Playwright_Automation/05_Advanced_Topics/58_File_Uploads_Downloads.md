# 58. File Uploads & Downloads — The Sharp Edges

**Navigation**: [← 57. Login Taxonomy](./57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md) | [Index](../00_INDEX.md) | [→ 59. Docker for Playwright](./59_Docker_For_Playwright.md)

---

## 5W1H

- **WHAT**: Playwright's file-IO APIs — `setInputFiles()` for uploads (single, multi, in-memory buffer, drag-drop), the `download` event for downloads, and assertion helpers for CSV/XLSX/PDF.
- **WHY**: File flows are where E2E tests reveal real bugs that unit tests can't — wrong MIME type, dropped chunks, charset mangling, missing CSP. They're also where most automation suites have the worst flakiness, because the API surface looks deceptively simple.
- **WHO**: Anyone whose app has an upload button, a "Download CSV" link, or a "Drop files here" zone. (Almost every B2B app.)
- **WHEN**: As soon as you have a feature that produces or consumes a file. Don't punt this to later — file flows are 30% of real bug reports in B2B apps.
- **HOW**: Sections 2–5 cover uploads; Sections 6–8 cover downloads; Section 9 covers cross-cutting assertion patterns. Reusable helpers live in [`framework/utilities/helpers/file.helpers.ts`](../framework/utilities/helpers/file.helpers.ts) and the runnable demo is at [`framework/tests/file-io/upload-download.spec.ts`](../framework/tests/file-io/upload-download.spec.ts).

---

## 0. War Stories — File Tests That Looked Fine but Weren't

### Story 1: Large-file upload that passed in 10MB tests but failed in 200MB production

A test uploaded a 10MB CSV file and asserted on the success message. The test passed consistently in CI (90-second default timeout).

In production, users regularly uploaded 150–300MB import files. The upload silently timed out on the backend after 60 seconds. The frontend showed "Upload complete" (it completed the HTTP PUT), but the backend processing job never received the full file and dropped it. Users saw "Upload complete" and then waited forever for the import to appear.

The test never reproduced this because 10MB uploaded in < 2 seconds — well within the 60-second backend timeout. The test proved the upload UI worked, not that the backend could handle real file sizes.

**What was missing:**
```typescript
test('large file upload completes processing', async ({ page }) => {
  // Generate a file that exercises the real size constraint
  const largeBuffer = Buffer.alloc(100 * 1024 * 1024); // 100MB
  await page.locator('input[type=file]').setInputFiles({
    name: 'large-import.csv',
    mimeType: 'text/csv',
    buffer: largeBuffer,
  });
  await page.locator('[data-testid="upload-btn"]').click();

  // Wait longer than the default timeout — large file takes time
  await expect(page.locator('[data-testid="import-status"]'))
    .toHaveText('Import complete', { timeout: 120_000 });
});
```

**Lesson:** Size is a test dimension. A 10MB test doesn't cover 200MB behavior. At minimum, test the boundary: what's the largest file your system claims to support? Test that file.

### Story 2: The charset-mangled CSV that was accepted and silently corrupted

A download test asserted: "clicking Export downloads a file named `export.csv`." Test passed.

The export CSV contained employee names with accented characters (Español teams, French offices). The backend generated the file in ISO-8859-1. The frontend served it with no `Content-Type: charset` header. Excel opened it and showed `Ren├®e Poirier` instead of `Renée Poirier`.

The test never read the file contents, only the filename.

**What the test should have checked:**
```typescript
const download = await page.waitForEvent('download');
const path = await download.path();
const content = fs.readFileSync(path!, 'utf-8');

// Check that known non-ASCII names survived the round-trip
expect(content).toContain('Renée Poirier');
expect(content).toContain('Ñoño García');
// Also check the header declares the right encoding
const resp = await page.request.get(download.url());
expect(resp.headers()['content-type']).toContain('charset=utf-8');
```

**Lesson:** Download tests that check only filename prove the download button works, not that the file is correct. For CSV/XLSX exports, always read back at least one row and assert on the actual values.

---

## 1. The honest pitch

The Playwright docs make file I/O look like two lines:

```typescript
await page.locator("input[type=file]").setInputFiles("path.csv");
const download = await page.waitForEvent("download");
```

That's the happy path. The reality:

- The "upload" element isn't an `<input type=file>` — it's a drag-zone with a hidden file picker.
- The button that opens the picker uses `showOpenFilePicker()` (File System Access API), which Playwright can't dismiss.
- The download event races with the click — same trap as the new-tab pattern.
- The downloaded file lives in a temp directory you have to clean up.
- The CSV your app emits has a UTF-8 BOM you didn't expect, breaking your byte-for-byte assertion.

This chapter covers all of those.

---

## 2. The Playwright upload model — `setInputFiles()`

The browser exposes `<input type="file">` as a JavaScript object with a `.files` property. Playwright's `setInputFiles()` writes the file directly to that property — **without** opening the OS file picker.

### Single file

```typescript
await page.locator("input[type=file]").setInputFiles("./test-data/sample.csv");
```

### Multiple files (multi-select)

```typescript
await page
  .locator("input[type=file]")
  .setInputFiles(["./test-data/a.csv", "./test-data/b.csv"]);
```

The element needs the `multiple` attribute. If it doesn't have it, Playwright takes only the last file silently. Verify:

```typescript
await expect(input).toHaveAttribute("multiple", "");
```

### In-memory buffer (no temp file on disk)

```typescript
await page.locator("input[type=file]").setInputFiles({
  name: "inline.csv",
  mimeType: "text/csv",
  buffer: Buffer.from("id,name\n1,Alice\n2,Bob\n", "utf8"),
});
```

This is the **right pattern for generated test data** — no `fs.writeFileSync` dance, no temp-file cleanup, no race with parallel workers writing the same file.

### Clear the input

```typescript
await page.locator("input[type=file]").setInputFiles([]);
```

Useful for testing "what happens when the user un-selects."

---

## 3. The hidden input — when there's no visible `<input type=file>`

Modern UIs hide the input behind a styled button or drop-zone. The HTML typically looks like:

```html
<button id="uploadBtn">Choose file</button>
<input type="file" id="hiddenFileInput" style="display:none" />
```

`page.click('#uploadBtn')` triggers `fileInput.click()` in JS, which opens the OS file picker. **Playwright cannot interact with the OS picker.**

❌ **Wrong**:

```typescript
await page.click("#uploadBtn");
// → OS file picker appears, test hangs
```

✅ **Right** — set files directly on the hidden input:

```typescript
await page.locator("#hiddenFileInput").setInputFiles("./test-data/sample.csv");
// Bypasses the button entirely — the file is now in input.files
```

Works even for `display: none` and `visibility: hidden` inputs. `setInputFiles()` doesn't require visibility.

### When the input is rendered on click (lazy)

Some UIs only insert the `<input>` after the user clicks the button. In that case, click first, then set files:

```typescript
await page.click("#uploadBtn");
await page.locator("input[type=file]").setInputFiles("./test-data/sample.csv");
// Most pickers auto-submit on file selection
```

### The `filechooser` event (no hidden input at all)

If the page uses `showOpenFilePicker()` (the File System Access API), there's no `<input>` to target. Use `page.waitForEvent('filechooser')` + `Promise.all`:

```typescript
const [chooser] = await Promise.all([
  page.waitForEvent("filechooser"),
  page.click("#uploadBtn"),
]);
await chooser.setFiles("./test-data/sample.csv");
```

Same `Promise.all([listener, trigger])` pattern as new-tab handling (Ch 12) — the race condition is identical.

---

## 4. Drag-and-drop uploads

Drag-drop zones don't expose an `<input>`. The app listens to `dragenter`/`drop` events and reads `event.dataTransfer.files`.

You can drive this from Playwright by dispatching synthetic `drop` events:

```typescript
const dropzone = page.locator(".dropzone");
const buffer = Buffer.from("id,name\n1,Alice\n", "utf8");

await dropzone.dispatchEvent("drop", {
  dataTransfer: await createDataTransfer(page, {
    name: "inline.csv",
    mimeType: "text/csv",
    buffer,
  }),
});
```

Where `createDataTransfer` is a small helper (see `framework/utilities/helpers/file.helpers.ts`):

```typescript
async function createDataTransfer(
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
): Promise<JSHandle<DataTransfer>> {
  return page.evaluateHandle(
    async ({ name, mimeType, base64 }) => {
      const dt = new DataTransfer();
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const file = new File([bytes], name, { type: mimeType });
      dt.items.add(file);
      return dt;
    },
    {
      name: file.name,
      mimeType: file.mimeType,
      base64: file.buffer.toString("base64"),
    },
  );
}
```

This is the most fragile of the upload patterns — it depends on the app actually using `dataTransfer.files`. Some dropzones use `dataTransfer.items` and require a slightly different shape. When it doesn't work, fall back to finding the underlying `<input>` (Section 3) — every dropzone has one if you look hard enough.

---

## 5. Upload anti-patterns

❌ **Calling `click()` on the visible button and praying**

```typescript
await page.click("#uploadBtn");
// → hangs on OS picker
```

❌ **Using `setInputFiles` on the visible button**

```typescript
await page.click('#uploadBtn').setInputFiles(...);  // TypeError
```

Only `<input type=file>` accepts `setInputFiles`. Find the underlying input.

❌ **Writing test data to disk before every upload**

```typescript
fs.writeFileSync("./tmp.csv", csvContents);
await input.setInputFiles("./tmp.csv");
fs.unlinkSync("./tmp.csv"); // race with parallel workers
```

Use the buffer form (Section 2.3) instead.

❌ **Forgetting `multiple`**

```typescript
await input.setInputFiles(["a.csv", "b.csv"]);
// Input has no `multiple` attribute → only b.csv is uploaded
```

Assert the attribute first, or handle one at a time.

---

## 6. The Playwright download model — the `download` event

Browsers fire a `'download'` event on `page` (or `context`) when a navigation results in a file download instead of a page render.

```typescript
const [download] = await Promise.all([
  page.waitForEvent("download"),
  page.click("#downloadCsvBtn"),
]);

const path = await download.path(); // path in Playwright's temp dir
await download.saveAs("./out/report.csv"); // copy to your chosen location
```

Critical things to know:

1. **`waitForEvent('download')` is a race**. The listener must be registered **before** the click. Always use `Promise.all`. (Same Quiz 02 Q2 trap.)
2. **`path()` returns a temp file**. Playwright deletes it when the context closes. Always `saveAs()` if you need it later.
3. **`failure()` returns the error string** if the download failed (e.g., network error). `null` if it succeeded.
4. **`url()`, `suggestedFilename()`** for assertions before reading the body.

---

## 7. Asserting on the suggested filename

```typescript
const [download] = await Promise.all([
  page.waitForEvent("download"),
  page.click("#downloadBtn"),
]);

expect(download.suggestedFilename()).toMatch(/^report-\d{4}-\d{2}-\d{2}\.csv$/);
```

The suggested filename comes from the `Content-Disposition` header. If the header is missing, browsers pick the URL path's last segment — often wrong. Asserting on the filename catches missing headers in your app.

---

## 8. Reading the downloaded bytes

```typescript
import * as fs from "node:fs";

const [download] = await Promise.all([
  page.waitForEvent("download"),
  page.click("#downloadCsvBtn"),
]);
const path = await download.path();
if (!path) throw new Error("Download failed: " + (await download.failure()));

const contents = fs.readFileSync(path, "utf8");
expect(contents).toContain("id,name");
expect(contents.split("\n")).toHaveLength(11); // header + 10 rows
```

### The BOM gotcha

If your CSV starts with `﻿` (a UTF-8 BOM, three bytes `EF BB BF`), the first column header is invisible:

```javascript
contents.split(",")[0]; // '﻿id'  — looks like 'id' in your IDE
contents.startsWith("id"); // false!
```

Strip it before comparing:

```typescript
const clean = contents.replace(/^﻿/, "");
```

### The line-ending gotcha

Apps deployed on Windows often emit `\r\n`; Unix apps emit `\n`. Don't write `split('\n')` if you care about row counts — use `split(/\r?\n/)` and filter empty trailing lines.

---

## 9. The reusable helpers — `framework/utilities/helpers/file.helpers.ts`

The framework ships a small typed wrapper around the patterns above so your specs stay declarative:

```typescript
// Upload a file by path
await uploadFile(input, "./test-data/sample.csv");

// Upload an in-memory buffer (no temp file)
await uploadBuffer(input, {
  name: "inline.csv",
  mimeType: "text/csv",
  buffer: Buffer.from("id,name\n1,Alice\n"),
});

// Download a file, save it, and return its parsed contents
const text = await downloadAndRead(
  page,
  page.locator("#downloadCsvBtn"),
  "./test-results/downloads/report.csv",
);

// Parse CSV with header-aware row mapping
const rows = parseCsv<{ id: string; name: string }>(text);
expect(rows[0]?.name).toBe("Alice");
```

Each helper:

- Logs to test annotations (same pattern as `action.helpers.ts`)
- Uses `Promise.all` for download race-safety
- Strips the BOM and normalizes line endings
- Returns typed rows for CSV parsing

See the file for the full implementations. Each is < 20 lines.

---

## 10. Cross-cutting patterns

### Pattern: assert on the file before assertion-by-side-effect

❌ **Wrong** — assert only on the UI:

```typescript
await page.click("#downloadBtn");
await expect(page.locator(".toast")).toHaveText("Download started");
// Test passes even if the download was empty / corrupt / wrong format
```

✅ **Right** — assert on the actual bytes:

```typescript
const [download] = await Promise.all([
  page.waitForEvent("download"),
  page.click("#downloadBtn"),
]);
const text = await readDownload(download);
expect(text).toContain("expected,header,row");
expect(parseCsv(text)).toHaveLength(10);
```

This is the "no success theatre" rule from Ch 15 applied to file downloads.

### Pattern: pin the file via `outputDir`

```typescript
test("download report", async ({ page }, testInfo) => {
  const dest = testInfo.outputPath("report.csv"); // resolves to test-results/.../report.csv
  await download.saveAs(dest);
  await testInfo.attach("report", { path: dest, contentType: "text/csv" });
});
```

The HTML report links to the attached file, so reviewers can re-download what the test saw without re-running.

### Pattern: PDF / XLSX assertions

For binary formats, byte-equality is brittle (PDF metadata changes per run). Use a parser:

| Format | Parser                           | What to assert                             |
| ------ | -------------------------------- | ------------------------------------------ |
| CSV    | `papaparse` or hand-rolled split | Header + row count + cell values           |
| XLSX   | `exceljs`                        | Sheet name, cell at `A1`, row count        |
| PDF    | `pdf-parse`                      | Extracted text contains expected strings   |
| JSON   | `JSON.parse`                     | Object shape, key values                   |
| ZIP    | `adm-zip`                        | Entry names, decompressed contents of each |

Parser deps are optional — the framework's `file.helpers.ts` exports CSV only. Add others as your app's downloads dictate.

---

## 11. Anti-patterns — the download hall of shame

❌ **No `Promise.all`**

```typescript
await page.click("#downloadBtn");
const download = await page.waitForEvent("download"); // race
```

❌ **Reading the file from a hardcoded path**

```typescript
await page.click("#downloadBtn");
const text = fs.readFileSync("/Users/you/Downloads/report.csv", "utf8");
// Doesn't work in CI, doesn't work for other developers, fragile to browser settings
```

❌ **Not handling download failures**

```typescript
const download = await page.waitForEvent("download");
const path = await download.path();
fs.readFileSync(path!, "utf8"); // path may be null if download.failure() is set
```

❌ **Comparing PDFs byte-for-byte**

```typescript
expect(downloaded).toEqual(fs.readFileSync("expected.pdf"));
// Fails on every run — PDF embeds creation timestamps
```

✅ Parse and compare the _content_, not the bytes.

---

## 12. Practice

<details>
<summary><strong>Practice 1 — Spot the bug</strong></summary>

```typescript
test("upload CSV", async ({ page }) => {
  await page.click("#uploadBtn");
  await page.locator("input[type=file]").setInputFiles("./data.csv");
  await expect(page.locator(".success")).toBeVisible();
});
```

**Bug**: The visible `#uploadBtn` opens the OS file picker. The picker hangs the test before `setInputFiles` runs.

**Fix**: Skip the click and set files directly on the underlying input:

```typescript
await page.locator("input[type=file]").setInputFiles("./data.csv");
```

</details>

<details>
<summary><strong>Practice 2 — Write the buffer upload</strong></summary>

Given a list of users, generate an in-memory CSV and upload it without writing to disk.

```typescript
const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];
```

**Solution**:

```typescript
const csv =
  ["id,name", ...users.map((u) => `${u.id},${u.name}`)].join("\n") + "\n";
await page.locator("input[type=file]").setInputFiles({
  name: "users.csv",
  mimeType: "text/csv",
  buffer: Buffer.from(csv, "utf8"),
});
```

</details>

<details>
<summary><strong>Practice 3 — Write the download + assertion</strong></summary>

Click `#exportBtn`, save the file to the test output dir, and assert the suggested filename matches `report-YYYY-MM-DD.csv`.

**Solution**:

```typescript
test("export report", async ({ page }, testInfo) => {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.click("#exportBtn"),
  ]);
  expect(download.suggestedFilename()).toMatch(
    /^report-\d{4}-\d{2}-\d{2}\.csv$/,
  );
  await download.saveAs(testInfo.outputPath(download.suggestedFilename()));
});
```

</details>

<details>
<summary><strong>Practice 4 — Multi-file upload with assertion</strong></summary>

Upload `a.csv` and `b.csv` to an input that has the `multiple` attribute, then assert both filenames appear in the visible chip list.

**Solution**:

```typescript
await page.locator("input[type=file]").setInputFiles(["./a.csv", "./b.csv"]);
await expect(page.locator(".file-chip")).toHaveCount(2);
await expect(page.locator(".file-chip").first()).toContainText("a.csv");
await expect(page.locator(".file-chip").last()).toContainText("b.csv");
```

</details>

---

## What's next

- **Ch 04** — async/await rules; `Promise.all` for the download race.
- **Ch 07** — E2E architecture; where uploads/downloads fit into a 15-step flow.
- **Ch 28** — Test data lifecycle; cleanup of files written to `test-results/`.
- **Ch 56** — Config; `outputDir` and how `testInfo.outputPath()` resolves.
- **Ch 59** — Docker; `/dev/shm` and chromium's behaviour with downloads in containers.

**Navigation**: [← 57. Login Taxonomy](./57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md) | [Index](../00_INDEX.md) | [→ 59. Docker for Playwright](./59_Docker_For_Playwright.md)


---

## Reality Check

**"File upload testing only needs happy path"**→ File uploads have more edge cases than any other form interaction: empty files (0 bytes), maximum size files (server limit, client limit, proxy limit may differ), incorrect MIME types (renaming .exe to .jpg), special characters in filenames (spaces, unicode, dots), multiple files when single expected, and file format validation (a valid JPEG header with corrupt data). Test at minimum: valid file, oversized file, wrong type, and empty file.

**"page.setInputFiles is the only upload mechanism"**→ setInputFiles works for standard HTML file inputs. But modern applications use: drag-and-drop upload zones (requires DataTransfer event simulation), paste from clipboard (requires clipboard API mocking), chunked upload with progress (requires monitoring multiple API requests), and third-party upload widgets (Dropzone, Uppy) with custom DOM structures.

**"Download testing means checking the file exists"**→ Verify downloads completely: file exists at expected path, file size is non-zero and matches expected size, file content is valid (open and parse for structured formats like CSV, JSON, PDF), and filename matches expected pattern. A download that produces a 0-byte file or an HTML error page saved as .csv passes existence checks but represents a bug.

**"File operations in tests use local filesystem paths"**→ In CI environments: paths differ from local development (Linux CI vs Windows local), temporary directories have different locations, file permissions may restrict write access, and container filesystems may have limited space. Use platform-agnostic path construction (path.join, os.tmpdir) and clean up temporary files to prevent CI disk space exhaustion.

**"Large file uploads can use production-size files"**→ Uploading a 500MB file in every test run wastes CI time and storage. Generate test files dynamically at the minimum size needed to test the behavior: 1KB for basic upload verification, just-over-limit size for rejection testing, and use API-level tests for large file processing logic. Reserve actual large file uploads for dedicated performance tests.
