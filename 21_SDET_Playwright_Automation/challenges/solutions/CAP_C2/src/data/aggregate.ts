import type { SuiteSummary } from '../types';

export interface TestResult {
  title: string;
  file: string;
  projectName?: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted';
  duration: number;
  errors?: string[];
  owner?: string;
  jiraLink?: string;
  tags?: string[];
  resultsLength: number;
  lastResultPassed: boolean;
}

function emptySummary(): SuiteSummary {
  return { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, duration: 0 };
}

export function aggregate(results: TestResult[]): {
  overall: SuiteSummary;
  byProject: Record<string, SuiteSummary>;
  byOwner: Record<string, SuiteSummary>;
  slowestTests: Array<{ title: string; duration: number; file: string }>;
  failedTests: Array<{ title: string; error: string; file: string }>;
} {
  const overall = emptySummary();
  const byProject: Record<string, SuiteSummary> = {};
  const byOwner: Record<string, SuiteSummary> = {};
  const slowestTests: Array<{ title: string; duration: number; file: string }> = [];
  const failedTests: Array<{ title: string; error: string; file: string }> = [];

  for (const r of results) {
    const isFlaky = r.resultsLength > 1 && r.lastResultPassed && r.status === 'passed';

    // Overall
    overall.total++;
    overall.duration += r.duration;
    if (r.status === 'passed') overall.passed++;
    else if (r.status === 'failed' || r.status === 'timedOut') overall.failed++;
    else if (r.status === 'skipped' || r.status === 'interrupted') overall.skipped++;
    if (isFlaky) overall.flaky++;

    // Per-project
    const proj = r.projectName || '(default)';
    if (!byProject[proj]) byProject[proj] = emptySummary();
    byProject[proj].total++;
    byProject[proj].duration += r.duration;
    if (r.status === 'passed') byProject[proj].passed++;
    else if (r.status === 'failed' || r.status === 'timedOut') byProject[proj].failed++;
    else if (r.status === 'skipped' || r.status === 'interrupted') byProject[proj].skipped++;
    if (isFlaky) byProject[proj].flaky++;

    // Per-owner
    const owner = r.owner || '(unassigned)';
    if (!byOwner[owner]) byOwner[owner] = emptySummary();
    byOwner[owner].total++;
    byOwner[owner].duration += r.duration;
    if (r.status === 'passed') byOwner[owner].passed++;
    else if (r.status === 'failed' || r.status === 'timedOut') byOwner[owner].failed++;
    else if (r.status === 'skipped' || r.status === 'interrupted') byOwner[owner].skipped++;
    if (isFlaky) byOwner[owner].flaky++;

    // Slowest
    slowestTests.push({ title: r.title, duration: r.duration, file: r.file });

    // Failed
    if (r.status === 'failed' || r.status === 'timedOut') {
      failedTests.push({
        title: r.title,
        error: r.errors?.[0] ?? 'Unknown error',
        file: r.file,
      });
    }
  }

  slowestTests.sort((a, b) => b.duration - a.duration);

  return { overall, byProject, byOwner, slowestTests, failedTests };
}

export function filterByTag(results: TestResult[], tag: string): TestResult[] {
  return results.filter((r) => r.tags?.includes(tag));
}

export function filterFailed(results: TestResult[]): TestResult[] {
  return results.filter((r) => r.status === 'failed' || r.status === 'timedOut');
}