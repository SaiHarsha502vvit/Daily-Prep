import * as path from 'node:path';
import { test, expect } from '@playwright/test';
import {
  uploadBuffer,
  uploadFile,
  downloadAndRead,
  parseCsv,
} from '../../utilities/helpers/file.helpers';

const UPLOAD_PAGE = `
<!doctype html>
<html><head><meta charset="utf-8"><title>Upload demo</title></head><body>
  <input id="single" type="file" />
  <input id="multi" type="file" multiple />
  <ul id="picked"></ul>
  <script>
    function describe(input, target) {
      input.addEventListener('change', () => {
        target.innerHTML = '';
        for (const f of input.files) {
          const li = document.createElement('li');
          li.textContent = f.name + ' (' + f.size + 'B, ' + f.type + ')';
          target.appendChild(li);
        }
      });
    }
    describe(document.getElementById('single'), document.getElementById('picked'));
    describe(document.getElementById('multi'),  document.getElementById('picked'));
  </script>
</body></html>
`;

const DOWNLOAD_PAGE = `
<!doctype html>
<html><head><meta charset="utf-8"><title>Download demo</title></head><body>
  <a id="export" href="data:text/csv;charset=utf-8,id%2Cname%2Crole%0A1%2CAlice%2Cadmin%0A2%2CBob%2Cuser%0A3%2CCarol%2Cmanager%0A" download="report-2026-01-01.csv">Download</a>
</body></html>
`;

test.describe('File uploads', () => {
  test('uploads a file from disk', async ({ page }) => {
    await page.setContent(UPLOAD_PAGE);
    const csvPath = path.resolve(__dirname, '..', '..', 'test-data', 'file-io', 'sample.csv');
    await uploadFile(page.locator('#single'), csvPath);
    await expect(page.locator('#picked li')).toHaveCount(1);
    await expect(page.locator('#picked li').first()).toContainText('sample.csv');
  });

  test('uploads an in-memory buffer without touching disk', async ({ page }) => {
    await page.setContent(UPLOAD_PAGE);
    await uploadBuffer(page.locator('#single'), {
      name: 'inline.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('id,name\n1,Alice\n', 'utf8'),
    });
    await expect(page.locator('#picked li').first()).toContainText('inline.csv');
    await expect(page.locator('#picked li').first()).toContainText('text/csv');
  });

  test('uploads multiple files when the input allows it', async ({ page }) => {
    await page.setContent(UPLOAD_PAGE);
    await page.locator('#multi').setInputFiles([
      {
        name: 'a.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('id,name\n1,Alice\n', 'utf8'),
      },
      {
        name: 'b.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('id,name\n2,Bob\n', 'utf8'),
      },
    ]);
    await expect(page.locator('#picked li')).toHaveCount(2);
  });
});

test.describe('File downloads', () => {
  test('downloads a CSV, asserts filename, parses contents', async ({ page }, testInfo) => {
    await page.setContent(DOWNLOAD_PAGE);
    const dest = testInfo.outputPath('report.csv');

    const text = await downloadAndRead(page, page.locator('#export'), dest);

    const rows = parseCsv<{ id: string; name: string; role: string }>(text);
    expect(rows).toHaveLength(3);
    expect(rows[0]?.name).toBe('Alice');
    expect(rows[2]?.role).toBe('manager');
  });
});
