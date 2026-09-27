# File I/O

> **Canonical lesson:** [58 File Uploads Downloads](../../03_Real_World_Scenarios/58_File_Uploads_Downloads.md). This page is a shorter summary kept for quick lookup; the chapter is the maintained version — if the two disagree, trust the chapter.

> The authoritative reference for uploads and downloads in Playwright. The 4 upload modalities, the download lifecycle, race-condition prevention, binary inspection, CSV/PDF/XLSX assertion patterns, OS-specific path quirks, large-file handling, and every production failure that's bitten teams.

---

## Table of contents

1. [The file I/O surface](#1-the-file-io-surface)
2. [Uploads — the 4 modalities](#2-uploads--the-4-modalities)
3. [`setInputFiles` — exhaustive options](#3-setinputfiles)
4. [Hidden inputs and the visibility bypass](#4-hidden-inputs)
5. [The `filechooser` event for custom UIs](#5-filechooser-event)
6. [Drag-and-drop uploads](#6-drag-and-drop)
7. [Downloads — the lifecycle](#7-downloads-lifecycle)
8. [`download.saveAs`, `path`, `failure`](#8-download-methods)
9. [Race-condition prevention](#9-race-condition-prevention)
10. [Binary content inspection](#10-binary-inspection)
11. [CSV assertion patterns](#11-csv-patterns)
12. [PDF assertion patterns](#12-pdf-patterns)
13. [XLSX assertion patterns](#13-xlsx-patterns)
14. [JSON / XML downloads](#14-json-xml)
15. [Large file handling](#15-large-files)
16. [OS-specific path quirks](#16-os-path-quirks)
17. [Performance considerations](#17-performance)
18. [Common production failures](#18-common-production-failures)
19. [Anti-pattern catalog](#19-anti-pattern-catalog)

---

## 1. The file I/O surface

Playwright file I/O has three primary APIs:

| API                                | For                                                      | Returns                |
| ---------------------------------- | -------------------------------------------------------- | ---------------------- |
| `locator.setInputFiles(...)`       | Uploads via `<input type="file">`                        | `Promise<void>`        |
| `page.waitForEvent('filechooser')` | Uploads via custom UI that triggers `<input>` indirectly | `Promise<FileChooser>` |
| `page.waitForEvent('download')`    | Downloads triggered by clicks, links, or window.open     | `Promise<Download>`    |

Plus a couple of supporting capabilities:

| API                                         | For                                                                              |
| ------------------------------------------- | -------------------------------------------------------------------------------- |
| `page.evaluateHandle(... DataTransfer ...)` | Simulating drag-and-drop                                                         |
| `request.post({ multipart })`               | API-level uploads (bypass UI) — see [`./06_api_testing.md`](./06_api_testing.md) |
| `acceptDownloads: true` (default)           | Without this, downloads error                                                    |

### 1.1 The mental model

```
UPLOAD: File → Browser memory → Multipart form post → Server
DOWNLOAD: Server response → Browser writes to temp → Playwright moves to your path
```

Playwright never sends files through Node's main thread. Uploads pass directly to the browser; downloads go from the browser to disk.

---

## 2. Uploads — the 4 modalities

| Modality         | When to use                                           |
| ---------------- | ----------------------------------------------------- |
| Path on disk     | The simplest case — file already exists               |
| Array of paths   | Multi-file inputs (`<input multiple>`)                |
| In-memory buffer | Generated test data; no disk write                    |
| `null` / `[]`    | Clear an input — useful for the "re-upload" scenarios |

### 2.1 Path on disk

```typescript
await page
  .locator("#csv-input")
  .setInputFiles(path.resolve("test-data/sample.csv"));
```

Resolves the path against `process.cwd()` (or current dir). Use absolute paths to avoid surprise.

### 2.2 Array of paths

```typescript
await page
  .locator("#multi")
  .setInputFiles([
    path.resolve("test-data/a.csv"),
    path.resolve("test-data/b.csv"),
  ]);
```

The element must have `multiple` attribute. Without it, only the first file is uploaded.

### 2.3 In-memory buffer

```typescript
await page.locator("#csv-input").setInputFiles({
  name: "inline.csv",
  mimeType: "text/csv",
  buffer: Buffer.from("id,name\n1,Alice\n2,Bob\n", "utf8"),
});
```

Use cases:

- Generated test data (no disk write)
- Synthetic files of specific sizes (1KB, 1MB, 100MB)
- Edge cases (empty file, file with BOM, binary)

### 2.4 Clearing the input

```typescript
await page.locator("#input").setInputFiles([]); // empty array
```

Resets the input to no file selected. Useful when testing the "re-upload" flow.

### 2.5 Combining with the multipart API

If your test doesn't need the UI behaviour, just send via API:

```typescript
await request.post("/api/upload", {
  multipart: {
    file: {
      name: "sample.csv",
      mimeType: "text/csv",
      buffer: csvBuffer,
    },
  },
});
```

Skips UI entirely. Faster, more deterministic. Only do this if you don't need to test the UI handling.

---

## 3. `setInputFiles`

The primary upload API. Exhaustive option reference.

### 3.1 Signature

```typescript
locator.setInputFiles(
  files: string | string[] | { name, mimeType, buffer } | { name, mimeType, buffer }[] | [],
  options?: { timeout?: number; noWaitAfter?: boolean }
): Promise<void>
```

### 3.2 `timeout` option

```typescript
await page.locator("#input").setInputFiles("big.csv", { timeout: 60_000 });
```

For very large uploads (100+ MB) where the browser needs time to read the file.

### 3.3 `noWaitAfter` option

```typescript
await page.locator("#input").setInputFiles("file.csv", { noWaitAfter: true });
```

By default, `setInputFiles` waits for the resulting `change` event to fire on the input. If the app behaves oddly (no change event), `noWaitAfter: true` skips that wait.

### 3.4 Hidden inputs

`setInputFiles` does NOT require the input to be visible. This is different from `click` / `fill`, which require visible elements.

```typescript
// Works even if the <input> is display:none
await page.locator('input[type="file"]').setInputFiles("file.csv");
```

This is essential because most modern UIs hide the native input behind a styled button.

### 3.5 Disabled inputs

`setInputFiles` ALSO works on disabled inputs (unlike click/fill). This is by design — many SPAs disable the input until other conditions are met, but the input is still wired.

For tests that specifically check "user can't upload until X", check the state separately:

```typescript
await expect(page.locator('input[type="file"]')).toBeDisabled();
```

### 3.6 What's sent on the wire

The browser constructs a multipart/form-data POST when the form is submitted. The file content is the buffer (in-memory) or the file's bytes (path).

`name` field becomes the filename in the multipart header. `mimeType` becomes Content-Type. Both are sent to the server.

---

## 4. Hidden inputs

Most modern UIs don't expose a native `<input type="file">`. Instead:

```html
<button type="button" id="upload-btn">Upload CSV</button>
<input id="csv-input" type="file" style="display:none" />
```

The button triggers `csv-input.click()` via JavaScript. Native browser opens the OS picker.

### 4.1 Bypassing the OS picker — direct setInputFiles

```typescript
// The button is what the user clicks, but Playwright can bypass it
await page.locator("#csv-input").setInputFiles("file.csv");
```

`setInputFiles` works directly on the hidden input. No need to click the button. No OS picker.

### 4.2 The bypass test pattern

If you want to test that the button TRIGGERS the input (not just hardcode the input):

```typescript
// Click the button; intercept the file chooser
const [fileChooser] = await Promise.all([
  page.waitForEvent("filechooser"),
  page.locator("#upload-btn").click(),
]);
await fileChooser.setFiles("file.csv");
```

This verifies the button-to-input wiring works. See §5.

### 4.3 Lazy inputs

Some UIs create the `<input>` only on demand (e.g., when the user clicks "Choose File"). The input doesn't exist initially.

In that case, `setInputFiles` fails because the locator doesn't match. Use the filechooser pattern:

```typescript
const [fileChooser] = await Promise.all([
  page.waitForEvent("filechooser"),
  page.locator("#choose-file-btn").click(),
]);
await fileChooser.setFiles("file.csv");
```

---

## 5. `filechooser` event

For UIs that create file inputs dynamically or for tests that verify the button-to-input wiring.

### 5.1 Basic pattern

```typescript
const [fileChooser] = await Promise.all([
  page.waitForEvent("filechooser"),
  page.locator("#upload").click(),
]);

await fileChooser.setFiles("test-data/sample.csv");
```

The `Promise.all` is essential — see [`./08_reliability.md#12-race-conditions`](./08_reliability.md#12-race-conditions).

### 5.2 The `FileChooser` interface

```typescript
interface FileChooser {
  element(): Locator; // the <input> that triggered
  isMultiple(): boolean; // whether <input multiple> is set
  page(): Page;
  setFiles(
    files:
      | string
      | string[]
      | { name; mimeType; buffer }
      | { name; mimeType; buffer }[],
    options?: { timeout?: number; noWaitAfter?: boolean },
  ): Promise<void>;
}
```

### 5.3 Conditional multi-file

```typescript
const [fileChooser] = await Promise.all([
  page.waitForEvent("filechooser"),
  page.locator("#upload").click(),
]);

if (fileChooser.isMultiple()) {
  await fileChooser.setFiles(["a.csv", "b.csv", "c.csv"]);
} else {
  await fileChooser.setFiles("a.csv");
}
```

Useful for tests that should work whether the input is single or multi.

### 5.4 When the event won't fire

If clicking the button does NOT trigger a file input (e.g., the button is wired to a different action), `waitForEvent` times out. Diagnose with the trace viewer — check if the page actually called `<input>.click()`.

### 5.5 Adblockers can swallow filechooser events

Some browser extensions block file inputs. Playwright tests run with no extensions by default. If you're using a custom user data directory with extensions, disable them.

---

## 6. Drag-and-drop

Some apps have a drag-and-drop file zone. `setInputFiles` doesn't work because there's no visible input — the drop event handler reads `DataTransfer.files`.

### 6.1 The DataTransfer trick

```typescript
async function dragAndDropFile(
  page: Page,
  target: Locator,
  file: { name: string; mimeType: string; buffer: Buffer },
) {
  const dataTransfer = await page.evaluateHandle(
    ({ name, mimeType, base64 }) => {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const dt = new DataTransfer();
      const f = new File([bytes], name, { type: mimeType });
      dt.items.add(f);
      return dt;
    },
    {
      name: file.name,
      mimeType: file.mimeType,
      base64: file.buffer.toString("base64"),
    },
  );

  await target.dispatchEvent("drop", { dataTransfer });
  await dataTransfer.dispose();
}
```

### 6.2 Usage

```typescript
await dragAndDropFile(page, page.locator(".drop-zone"), {
  name: "sample.csv",
  mimeType: "text/csv",
  buffer: Buffer.from("id,name\n1,Alice\n"),
});
```

The drop event handler in the app receives a `DataTransfer` with one file, identical to what a real drag-and-drop would produce.

### 6.3 The full drag sequence

For UIs that respond to `dragover`, `dragenter`, `dragleave` (e.g., showing a visual indicator):

```typescript
async function simulateDrag(page: Page, target: Locator, file: InMemoryFile) {
  const dt = await createDataTransfer(page, file);
  await target.dispatchEvent("dragenter", { dataTransfer: dt });
  await target.dispatchEvent("dragover", { dataTransfer: dt });
  await target.dispatchEvent("drop", { dataTransfer: dt });
  await dt.dispose();
}
```

Not always necessary — most apps only listen for `drop`. Adapt to the app under test.

---

## 7. Downloads — the lifecycle

```
1. User clicks a link / button / window.open
2. Server responds with Content-Disposition: attachment
3. Browser saves to a temporary location
4. Playwright fires 'download' event with a Download object
5. Test calls download.path() or download.saveAs(path) to retrieve
6. After test, Playwright cleans up the temp file
```

### 7.1 Enabling downloads

```typescript
// playwright.config.ts
use: {
  acceptDownloads: true,    // default — but explicit is good
}
```

If `acceptDownloads: false`, the `download` event fires but the file is NOT saved.

### 7.2 The basic pattern

```typescript
const [download] = await Promise.all([
  page.waitForEvent("download"),
  page.locator("#export-csv").click(),
]);

const path = await download.path(); // temp path
console.log("Downloaded to:", path);
```

### 7.3 `download.suggestedFilename()`

```typescript
const filename = download.suggestedFilename();
console.log("Server suggested:", filename); // e.g., "report-2026-01-01.csv"
```

Comes from `Content-Disposition: attachment; filename=...` header. Use to assert the server is returning the expected filename.

### 7.4 `download.saveAs(path)`

```typescript
const saveAsPath = testInfo.outputPath("report.csv");
await download.saveAs(saveAsPath);
console.log("Saved to:", saveAsPath);
```

Moves the temp file to your specified path. Use `testInfo.outputPath` so the file lands in the test's output dir (auto-cleaned per Playwright's lifecycle).

### 7.5 `download.failure()`

```typescript
const error = await download.failure();
if (error) {
  throw new Error(`Download failed: ${error}`);
}
```

Returns the error string if the download was aborted (network error, user cancel, etc.) or `null` if successful.

Always check failure before reading the file — `path()` on a failed download may return an empty file or throw.

### 7.6 `download.url()`

```typescript
const url = download.url();
console.log("Source URL:", url);
```

The URL the download came from. Useful for verifying the right endpoint produced the file.

### 7.7 The complete download helper

```typescript
async function downloadAndRead(
  page: Page,
  trigger: Locator,
  saveAsPath: string,
): Promise<string> {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    trigger.click(),
  ]);

  const failure = await download.failure();
  if (failure) throw new Error(`Download failed: ${failure}`);

  await fs.mkdirSync(path.dirname(saveAsPath), { recursive: true });
  await download.saveAs(saveAsPath);
  return fs.readFileSync(saveAsPath, "utf8");
}
```

---

## 8. `download` methods

| Method                | Returns                   | Use                                         |
| --------------------- | ------------------------- | ------------------------------------------- |
| `path()`              | `Promise<string \| null>` | Temp path (`/tmp/playwright-artifacts/...`) |
| `saveAs(path)`        | `Promise<void>`           | Copy to a specified location                |
| `suggestedFilename()` | `string`                  | Server-suggested filename                   |
| `url()`               | `string`                  | Source URL                                  |
| `failure()`           | `Promise<string \| null>` | Error if any                                |
| `cancel()`            | `Promise<void>`           | Abort the download mid-flight               |
| `createReadStream()`  | `Promise<Readable>`       | Node stream for large files                 |
| `delete()`            | `Promise<void>`           | Explicit cleanup                            |

### 8.1 Streaming large downloads

For files >500 MB, avoid `path()` + `readFileSync` (loads into memory). Use streams:

```typescript
const stream = await download.createReadStream();
const hash = crypto.createHash("sha256");
for await (const chunk of stream) {
  hash.update(chunk);
}
const sha = hash.digest("hex");
expect(sha).toBe("expected-sha256...");
```

### 8.2 Cancellation

```typescript
const downloadPromise = page.waitForEvent("download");
await page.locator("#big-download").click();
const download = await downloadPromise;

// Decide based on something — maybe the user clicked Cancel
await download.cancel();

const failure = await download.failure();
expect(failure).toContain("cancel");
```

For testing the UI's "cancel" UX path.

### 8.3 `saveAs` vs `path` — which to use

| Use `saveAs` when                             | Use `path` when                 |
| --------------------------------------------- | ------------------------------- |
| You need the file to persist after the test   | Quick one-shot read in the test |
| You're attaching the file to the test report  | You just need to verify content |
| You're checking the file from another process | Single-test read                |

`saveAs(testInfo.outputPath(...))` is the canonical pattern — the file lands in the test's output dir, gets cleaned up automatically per the `preserveOutput` setting.

---

## 9. Race-condition prevention

The classic mistake — registering `waitForEvent` after triggering.

### 9.1 The bug

```typescript
// ❌ waitForEvent registered AFTER click
await page.locator("#export").click();
const download = await page.waitForEvent("download");
// If the download fires immediately (small file), the event is missed.
// waitForEvent hangs until timeout.
```

### 9.2 The fix

```typescript
// ✅ Promise.all — register listener FIRST
const [download] = await Promise.all([
  page.waitForEvent("download"),
  page.locator("#export").click(),
]);
```

Mechanics:

- `Promise.all` evaluates its array left-to-right.
- `page.waitForEvent('download')` registers the listener SYNCHRONOUSLY.
- `page.locator('#export').click()` starts asynchronously.
- By the time the click triggers the download, the listener is in place.

### 9.3 The same pattern for all event-driven flows

```typescript
// New tab
const [newPage] = await Promise.all([
  context.waitForEvent("page"),
  trigger.click(),
]);

// File chooser
const [chooser] = await Promise.all([
  page.waitForEvent("filechooser"),
  trigger.click(),
]);

// Download
const [download] = await Promise.all([
  page.waitForEvent("download"),
  trigger.click(),
]);

// API response
const [response] = await Promise.all([
  page.waitForResponse(predicate),
  trigger.click(),
]);
```

### 9.4 The `Promise.all` requires careful unpacking

```typescript
// ❌ This swallows errors
Promise.all([page.waitForEvent("download"), trigger.click()]);

// ✅ Always await
await Promise.all([page.waitForEvent("download"), trigger.click()]);

// ✅ Destructure to get the event result
const [download] = await Promise.all([
  page.waitForEvent("download"),
  trigger.click(),
]);
```

Without destructuring, you have the event listener result but no variable to use it. Without `await`, errors are swallowed.

---

## 10. Binary content inspection

After downloading, you'll often want to verify the file content.

### 10.1 Reading as bytes

```typescript
import * as fs from "node:fs";

const buf = fs.readFileSync(savedPath);
console.log(buf.length, "bytes");
console.log(buf.slice(0, 4).toString("hex")); // first 4 bytes (file signature)
```

### 10.2 File signatures (magic numbers)

| File type         | Hex signature             | ASCII      |
| ----------------- | ------------------------- | ---------- |
| PDF               | `25 50 44 46`             | `%PDF`     |
| ZIP / XLSX / DOCX | `50 4B 03 04`             | `PK..`     |
| PNG               | `89 50 4E 47 0D 0A 1A 0A` | `.PNG....` |
| JPEG              | `FF D8 FF E0`             | `....`     |
| GIF               | `47 49 46 38`             | `GIF8`     |
| BMP               | `42 4D`                   | `BM`       |
| CSV with BOM      | `EF BB BF` then text      | `﻿...`     |

Assert on signature for a fast "is this the right file type":

```typescript
const signature = buf.slice(0, 4).toString("hex").toUpperCase();
expect(signature).toBe("25504446"); // PDF
```

### 10.3 Reading as text (with BOM handling)

```typescript
function readTextNormalised(filePath: string): string {
  const raw = fs.readFileSync(filePath, "utf8");
  return raw.replace(/^﻿/, ""); // strip BOM if present
}
```

BOM (Byte Order Mark) is invisible but breaks string matching:

```typescript
// File starts with BOM + "id,name"
const text = fs.readFileSync(path, "utf8");
expect(text.startsWith("id,name")).toBe(false); // BOM in the way!

const clean = readTextNormalised(path);
expect(clean.startsWith("id,name")).toBe(true);
```

### 10.4 Line endings

| OS                   | Default       |
| -------------------- | ------------- |
| Windows              | `\r\n` (CRLF) |
| Unix / macOS / Linux | `\n` (LF)     |
| Old Mac (pre-OSX)    | `\r` (CR)     |

Servers running on Linux often write LF; Windows users often see CRLF after a copy step. Normalise:

```typescript
const lines = text.split(/\r?\n/);
```

`\r?\n` matches both CRLF and LF.

---

## 11. CSV patterns

### 11.1 Parsing

Use a real CSV library for production. For tests with simple data, a small parser is fine:

```typescript
function parseCsv<T extends Record<string, string>>(text: string): T[] {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const [header, ...rest] = lines;
  if (!header) return [];
  const headers = splitCsvRow(header);
  return rest.map((line) => {
    const cells = splitCsvRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row as T;
  });
}

function splitCsvRow(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}
```

This handles quoted cells and escaped quotes.

### 11.2 Assertions

```typescript
const rows = parseCsv<{ id: string; name: string; role: string }>(text);
expect(rows).toHaveLength(3);
expect(rows[0]).toEqual({ id: "1", name: "Alice", role: "admin" });
expect(rows.find((r) => r.role === "admin")?.name).toBe("Alice");
```

### 11.3 Column-level assertions

```typescript
const ids = rows.map((r) => r.id);
expect(ids).toEqual(["1", "2", "3"]);
expect(ids).not.toContain(""); // no empty IDs
```

### 11.4 Production-grade CSV with `papaparse`

```typescript
import Papa from "papaparse";

const parsed = Papa.parse<{ id: string; name: string }>(text, {
  header: true,
  skipEmptyLines: true,
  transform: (v) => v.trim(),
});
expect(parsed.errors).toHaveLength(0);
expect(parsed.data).toHaveLength(3);
```

Use for production tests; the inline parser is fine for quick assertions.

---

## 12. PDF patterns

PDFs are binary. To assert content, you need a parser.

### 12.1 Using `pdf-parse`

```bash
npm i -D pdf-parse
```

```typescript
import pdf from "pdf-parse";

const buf = fs.readFileSync(savedPath);
const result = await pdf(buf);

expect(result.numpages).toBe(2);
expect(result.text).toContain("Invoice #INV-001");
expect(result.text).toContain("Amount: $150.00");
```

`result.text` is all text extracted, with newlines between pages. Whitespace is preserved.

### 12.2 Asserting on specific pages

```typescript
const result = await pdf(buf);
const pages = result.text.split("\f"); // form feed character between pages

expect(pages[0]).toContain("Page 1 header");
expect(pages[1]).toContain("Page 2 body");
```

### 12.3 Font and layout assertions

`pdf-parse` doesn't expose fonts, sizes, or positions. For that:

```bash
npm i -D pdf2pic pdf-text-extract
```

Or use a visual regression approach — convert PDF to image, screenshot-compare.

### 12.4 PDF/A and accessibility

For production legal/financial PDFs:

```typescript
import { pdfA } from "pdf-lib-extensions";

const isCompliant = await pdfA.checkCompliance(buf);
expect(isCompliant).toBe(true);
```

Real PDF/A validation requires tools beyond `pdf-parse`. Out of scope for most QA tests.

### 12.5 PDF signatures

PDFs start with `%PDF-1.x`. Quick sanity:

```typescript
const buf = fs.readFileSync(savedPath);
expect(buf.slice(0, 5).toString()).toBe("%PDF-");
expect(buf.slice(5, 8).toString()).toMatch(/^1\.\d$/); // %PDF-1.4 to 1.7
```

---

## 13. XLSX patterns

XLSX files are ZIP archives containing XML.

### 13.1 Using `xlsx`

```bash
npm i -D xlsx
```

```typescript
import * as XLSX from "xlsx";

const workbook = XLSX.readFile(savedPath);
expect(workbook.SheetNames).toEqual(["Summary", "Details"]);

const summary = workbook.Sheets["Summary"];
const json = XLSX.utils.sheet_to_json<{ Category: string; Total: number }>(
  summary,
);

expect(json).toHaveLength(5);
expect(json[0].Total).toBe(150);
```

### 13.2 Cell-level assertions

```typescript
const sheet = workbook.Sheets["Details"];
expect(sheet["A1"].v).toBe("Header");
expect(sheet["B2"].v).toBe(150);
expect(sheet["C3"].t).toBe("s"); // type: 's' = string, 'n' = number, 'd' = date
```

### 13.3 Date cells

XLSX dates are serial numbers (days since 1900). Use the helper:

```typescript
const cell = sheet["A5"];
expect(XLSX.utils.format_cell(cell)).toBe("1/1/2026");
```

Or compare the underlying number to an expected serial date.

---

## 14. JSON / XML

### 14.1 JSON

```typescript
const text = fs.readFileSync(path, "utf8");
const json = JSON.parse(text);
expect(json.orders).toHaveLength(3);
expect(json.orders[0].id).toBe("ORD-001");
```

For complex shapes, use Zod or a JSON schema validator:

```typescript
import { z } from "zod";

const Schema = z.object({
  orders: z.array(z.object({ id: z.string(), amount: z.number() })),
});

const json = Schema.parse(JSON.parse(text));
expect(json.orders).toHaveLength(3);
```

### 14.2 XML

```bash
npm i -D fast-xml-parser
```

```typescript
import { XMLParser } from "fast-xml-parser";

const text = fs.readFileSync(path, "utf8");
const parser = new XMLParser();
const obj = parser.parse(text);

expect(obj.report.orders.order).toHaveLength(3);
expect(obj.report.orders.order[0]["@_id"]).toBe("ORD-001");
```

`@_` prefix denotes XML attributes (vs child elements).

---

## 15. Large files

### 15.1 The memory problem

`Buffer.from('file content')` for a 1 GB file:

- Allocates 1 GB in JS heap.
- Plus 1 GB copy during transfer to the browser.
- Plus 1 GB in browser memory.

For very large files, you'll OOM the worker.

### 15.2 Upload via path (streaming)

```typescript
await page.locator("#input").setInputFiles("/path/to/big.bin");
// Playwright streams from disk; no buffer in JS memory
```

For files >100 MB, always use the path form.

### 15.3 Download via stream

```typescript
const stream = await download.createReadStream();
const hash = crypto.createHash("sha256");

for await (const chunk of stream) {
  hash.update(chunk);
}

expect(hash.digest("hex")).toBe("expected-sha256");
```

No memory accumulation. Even multi-GB downloads work.

### 15.4 Synthesising large test files

```typescript
import * as fs from "node:fs";

function makeSyntheticFile(path: string, sizeMB: number): void {
  const fd = fs.openSync(path, "w");
  const chunk = Buffer.alloc(1024 * 1024, 0xaa); // 1 MB of repeating 0xAA
  for (let i = 0; i < sizeMB; i++) {
    fs.writeSync(fd, chunk);
  }
  fs.closeSync(fd);
}

// Use in test setup
makeSyntheticFile("/tmp/big.bin", 100); // 100 MB
await page.locator("#input").setInputFiles("/tmp/big.bin");
```

Don't commit large files to the repo — generate at test time.

### 15.5 Timeout for large uploads

```typescript
await page
  .locator("#input")
  .setInputFiles("/tmp/big.bin", { timeout: 120_000 });
```

Default 30s. A 1 GB upload over a slow network can take longer.

---

## 16. OS-specific path quirks

### 16.1 Windows path separators

```typescript
// ❌ Broken on Windows
await page.locator("#input").setInputFiles("test-data/sample.csv");

// ✅ Always
await page
  .locator("#input")
  .setInputFiles(path.resolve("test-data", "sample.csv"));
```

`path.resolve` produces native separators (`\` on Windows, `/` elsewhere).

### 16.2 Special characters in filenames

Filenames with spaces, accents, or symbols:

```typescript
await page.locator("#input").setInputFiles("/tmp/résumé file.pdf");
```

Playwright handles them correctly on all OSs, but the server may not. Test with `setInputFiles({ name: 'résumé.pdf', buffer })` to verify the server.

### 16.3 Filename length limits

| OS                          | Max filename | Max path           |
| --------------------------- | ------------ | ------------------ |
| Linux                       | 255 chars    | 4096 chars         |
| macOS                       | 255 chars    | 1024 chars typical |
| Windows (default)           | 255 chars    | 260 chars          |
| Windows (long path enabled) | 255 chars    | 32,767 chars       |

If your test generates long names, you may hit `ENAMETOOLONG` on Windows.

### 16.4 Permissions

Linux/Mac: `chmod 600` for test files containing credentials. Windows: NTFS ACLs.

```typescript
import * as fs from "node:fs";
fs.chmodSync("/tmp/creds.key", 0o600);
```

### 16.5 Temp directory paths

| OS      | Default temp                         |
| ------- | ------------------------------------ |
| Linux   | `/tmp`                               |
| macOS   | `/private/var/folders/...`           |
| Windows | `C:\Users\<user>\AppData\Local\Temp` |

Use `os.tmpdir()`:

```typescript
import * as os from "node:os";
const tempFile = path.join(os.tmpdir(), `playwright-test-${Date.now()}.bin`);
```

---

## 17. Performance

### 17.1 Upload size vs time

| Size   | Path-based | Buffer-based | API-direct |
| ------ | ---------- | ------------ | ---------- |
| 1 KB   | ~30 ms     | ~25 ms       | ~10 ms     |
| 100 KB | ~50 ms     | ~45 ms       | ~20 ms     |
| 1 MB   | ~150 ms    | ~200 ms      | ~80 ms     |
| 10 MB  | ~800 ms    | ~1500 ms     | ~400 ms    |
| 100 MB | ~6 s       | OOM risk     | ~2 s       |

API-direct (no UI) is always fastest. Use it when the test isn't testing the UI behavior.

### 17.2 Download size vs time

Roughly mirrors upload, plus the time `saveAs` takes to copy.

### 17.3 Trace inflation

Uploaded/downloaded files in `trace: 'on'` mode go into the trace zip:

| Trace mode            | File capture?                           |
| --------------------- | --------------------------------------- |
| `'off'`               | No                                      |
| `'retain-on-failure'` | Yes, only on failure                    |
| `'on'`                | Yes — adds upload size × tests to trace |

A 100 MB upload × 50 tests with `trace: 'on'` = 5 GB of traces. Disable trace for file-heavy tests or use `'retain-on-failure'`.

### 17.4 Network overhead

The path-based upload still transfers through the browser's network stack. Local Docker = fast. Cross-region = slow.

If many tests upload, consider:

- Mounting a local volume in Docker for the test data files.
- Generating in-memory buffers (no disk I/O on the test side).

---

## 18. Common production failures

### Failure 1 — `waitForEvent('download')` times out

**Symptom:** Test hangs 30s, fails with timeout.

**Cause:** `waitForEvent` registered AFTER the click. Race condition.

**Fix:** Wrap in `Promise.all`.

### Failure 2 — Download happens but file is empty

**Symptom:** `path()` returns a path; reading the file gives 0 bytes.

**Cause:** Server closed the connection mid-stream. Or client-side abort.

**Fix:** Check `download.failure()` before reading. If non-null, fail the test with the error.

### Failure 3 — CSV assertion fails by 1 line

**Symptom:** `expect(rows).toHaveLength(3)` fails with 4 found.

**Cause:** Trailing newline counted as an empty row.

**Fix:** `parseCsv` filters empty lines: `lines.filter(l => l.length > 0)`.

### Failure 4 — PDF text extraction returns garbage

**Symptom:** `pdf-parse` returns "ÆÆÆÆ..." characters.

**Cause:** PDF uses an embedded subset font with a custom CMap. Text extraction libs can't decode.

**Fix:** Use the source data (server side) for assertions; reserve PDF assertions for "is the file structurally a PDF" sanity.

### Failure 5 — `setInputFiles` errors with "no such file"

**Symptom:** `ENOENT: no such file or directory`.

**Cause:** Relative path resolved against the wrong CWD. Common in monorepos.

**Fix:** Always use `path.resolve(__dirname, '...')` or absolute paths.

### Failure 6 — Drag-and-drop in headless mode doesn't trigger

**Symptom:** Works in headed; doesn't work headless.

**Cause:** Some drop zones use `pointerenter`/`pointermove` events that Playwright doesn't dispatch automatically.

**Fix:** Dispatch the full sequence: `dragenter`, `dragover`, `drop`. See §6.

### Failure 7 — Large upload OOMs the worker

**Symptom:** Worker process exits with `JavaScript heap out of memory`.

**Cause:** Created a 1 GB buffer in test code.

**Fix:** Stream from disk (`setInputFiles(path)` not `setInputFiles({ buffer })`).

### Failure 8 — Test fails on Windows but passes on Mac/Linux

**Symptom:** `Error: ENOENT: no such file or directory, open 'test-data/sample.csv'`.

**Cause:** Forward slashes in the path on Windows are sometimes OK, sometimes not — depends on `path.normalize` behaviour in surrounding code.

**Fix:** Use `path.resolve` everywhere. Or run CI on the same OS as production.

### Failure 9 — `download.path()` is null

**Symptom:** Path is null even though no failure.

**Cause:** `acceptDownloads: false` in config (default in older Playwright).

**Fix:** Explicitly set `acceptDownloads: true`.

### Failure 10 — Multipart upload corrupted at server

**Symptom:** Server receives the file but rejects as "invalid format."

**Cause:** Filename in the multipart header has non-ASCII characters not properly RFC-5987-encoded.

**Fix:** Use ASCII filenames in tests. If you need to test non-ASCII handling specifically, verify the server's RFC 5987 support.

---

## 19. Anti-pattern catalog

| ❌                                                      | ✅                                                                                 |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `setInputFiles` then read the file immediately          | Wait for upload completion via UI signal (`expect(loc).toContainText('Uploaded')`) |
| Click button THEN `waitForEvent`                        | `Promise.all([waitForEvent, click])`                                               |
| `setInputFiles({ buffer })` for >50 MB                  | Use path-based: write to temp file first                                           |
| `fs.readFileSync(buf)` for downloaded GB-files          | `createReadStream`                                                                 |
| Hardcoded forward-slash paths                           | `path.resolve`                                                                     |
| Assuming downloads work without `acceptDownloads: true` | Set explicitly in config                                                           |
| Asserting on PDF text positions                         | Verify content via the source data API; PDF assertions stay structural             |
| Cleanup downloaded file with `fs.unlink` in afterEach   | Use `testInfo.outputPath` — Playwright cleans up                                   |
| `download.path()` without `failure()` check             | Always check failure first                                                         |
| Stripping BOM only sometimes                            | Always normalise reads via a helper                                                |
| `setInputFiles` with relative path                      | Absolute or `path.resolve`                                                         |
| Custom temp dir without cleanup                         | Use `os.tmpdir()` + `testInfo.outputPath`                                          |
| `setInputFiles` on a `<button>` element                 | Must be `<input type="file">`                                                      |
| Test that uploads a real production file from repo      | Synthesise at test time                                                            |

---

## Cross-references

- Multipart API uploads: [`./06_api_testing.md#62-multipart-deep-dive`](./06_api_testing.md#62-multipart-deep-dive)
- Race conditions: [`./08_reliability.md#12-race-conditions`](./08_reliability.md#12-race-conditions)
- CI artifact upload: [`./10_ci_docker.md`](./10_ci_docker.md)
- Real helpers in code: [`../framework/utilities/helpers/file.helpers.ts`](../../framework/utilities/helpers/file.helpers.ts)
