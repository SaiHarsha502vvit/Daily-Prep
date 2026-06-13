import * as fs from 'fs';
import * as path from 'path';

export interface PlaywrightTest {
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted';
  duration: number;
  errors: string[];
}

export interface PlaywrightReport {
  file: string;
  tests: PlaywrightTest[];
}

function isPlaywrightReport(obj: unknown): obj is { tests?: unknown[] } {
  return typeof obj === 'object' && obj !== null && Array.isArray((obj as { tests?: unknown }).tests);
}

export function readJsonReports(dirPath: string): PlaywrightReport[] {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Reports directory does not exist: ${dirPath}`);
  }

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    throw new Error(`No JSON files found in: ${dirPath}`);
  }

  const reports: PlaywrightReport[] = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);

    if (!isPlaywrightReport(parsed)) {
      throw new Error(`Invalid Playwright JSON report format in: ${file}`);
    }

    const tests: PlaywrightTest[] = (parsed.tests ?? []).map((t: unknown) => {
      if (typeof t !== 'object' || t === null) {
        throw new Error(`Invalid test entry in: ${file}`);
      }
      const test = t as Record<string, unknown>;
      return {
        title: String(test.title ?? ''),
        status: ['passed', 'failed', 'skipped', 'timedOut', 'interrupted'].includes(String(test.status))
          ? (test.status as PlaywrightTest['status'])
          : 'failed',
        duration: Number(test.duration ?? 0),
        errors: Array.isArray(test.errors) ? test.errors.map(String) : [],
      };
    });

    reports.push({ file, tests });
  }

  return reports;
}