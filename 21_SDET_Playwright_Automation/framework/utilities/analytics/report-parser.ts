import * as fs from 'fs';

export interface TestResult {
  testName: string;
  filePath: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  errors: string[];
  project: string;
}

/**
 * Parses a Playwright JSON report file into structured TestResult objects.
 */
export function parsePlaywrightReport(reportPath: string): TestResult[] {
  const raw = fs.readFileSync(reportPath, 'utf-8');
  const report = JSON.parse(raw);

  const results: TestResult[] = [];

  // Recursive helper to traverse nested suite structure
  const processSuite = (suite: {
    title?: string;
    file?: string;
    specs?: Array<{
      title?: string;
      file?: string;
      tests?: Array<{
        title?: string;
        status?: string;
        results?: Array<{
          status?: string;
          duration?: number;
          error?: { message?: string };
        }>;
      }>;
    }>;
    suites?: unknown[];
  }): void => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const firstResult = test.results?.[0];
        const status = normalizeStatus(firstResult?.status ?? test.status ?? '');
        results.push({
          testName: test.title ?? '(unnamed)',
          filePath: spec.file ?? suite.file ?? '',
          status,
          duration: firstResult?.duration ?? 0,
          errors: extractErrors(test.results ?? []),
          project: suite.title ?? 'unknown',
        });
      }
    }
    for (const child of suite.suites ?? []) {
      processSuite(child as typeof suite);
    }
  };

  for (const topLevel of report.suites ?? []) {
    // The report.suites array is `unknown[]` so the inner element must be
    // narrowed before passing to processSuite, which expects the typed shape.
    processSuite(topLevel as Parameters<typeof processSuite>[0]);
  }

  return results;
}

function normalizeStatus(status: string): TestResult['status'] {
  switch (status) {
    case 'passed':
      return 'passed';
    case 'failed':
      return 'failed';
    case 'skipped':
      return 'skipped';
    case 'timedOut':
      return 'timedOut';
    default:
      return 'failed';
  }
}

function extractErrors(
  results: Array<{ error?: { message?: string }; status?: string }>,
): string[] {
  const messages: string[] = [];
  for (const r of results) {
    if (r.status !== 'failed') continue;
    const msg = r.error?.message;
    if (msg) messages.push(msg);
  }
  return messages;
}
