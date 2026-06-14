import * as fs from 'node:fs';
import * as path from 'node:path';

import { type Locator, type Page, type Download, type JSHandle } from '@playwright/test';

export interface InMemoryFile {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

export async function uploadFile(input: Locator, filePath: string): Promise<void> {
  await input.setInputFiles(filePath);
  if (process.env.LOG_ACTIONS === 'true') {
    console.log(`[upload] ${path.basename(filePath)}`);
  }
}

export async function uploadBuffer(input: Locator, file: InMemoryFile): Promise<void> {
  await input.setInputFiles({
    name: file.name,
    mimeType: file.mimeType,
    buffer: file.buffer,
  });
  if (process.env.LOG_ACTIONS === 'true') {
    console.log(`[upload-buffer] ${file.name} (${file.buffer.byteLength}B, ${file.mimeType})`);
  }
}

export async function triggerDownload(page: Page, trigger: Locator): Promise<Download> {
  const [download] = await Promise.all([page.waitForEvent('download'), trigger.click()]);
  const failure = await download.failure();
  if (failure) {
    throw new Error(`[download] failed: ${failure}`);
  }
  return download;
}

export async function downloadAndRead(
  page: Page,
  trigger: Locator,
  saveAsPath: string,
): Promise<string> {
  const download = await triggerDownload(page, trigger);
  fs.mkdirSync(path.dirname(saveAsPath), { recursive: true });
  await download.saveAs(saveAsPath);
  return readTextNormalised(saveAsPath);
}

export function readTextNormalised(filePath: string): string {
  const raw = fs.readFileSync(filePath, 'utf8');
  // Strip UTF-8 BOM (U+FEFF) if present — common in files saved by Windows Notepad.
  return raw.replace(/^\uFEFF/, '');
}

export function parseCsv<T extends Record<string, string>>(text: string): T[] {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  const [headerLine, ...rest] = lines;
  if (!headerLine) return [];
  const headers = splitCsvRow(headerLine);
  return rest.map((line) => {
    const cells = splitCsvRow(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = cells[idx] ?? '';
    });
    return row as T;
  });
}

function splitCsvRow(line: string): string[] {
  const cells: string[] = [];
  let current = '';
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
    } else if (ch === ',') {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

export async function createDataTransfer(
  page: Page,
  file: InMemoryFile,
): Promise<JSHandle<DataTransfer>> {
  return page.evaluateHandle(
    ({ name, mimeType, base64 }) => {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const dt = new DataTransfer();
      const blob = new File([bytes], name, { type: mimeType });
      dt.items.add(blob);
      return dt;
    },
    {
      name: file.name,
      mimeType: file.mimeType,
      base64: file.buffer.toString('base64'),
    },
  );
}
