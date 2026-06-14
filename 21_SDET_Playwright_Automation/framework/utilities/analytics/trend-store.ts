import * as fs from 'fs';

export interface TestResult {
  testName: string;
  filePath: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  errors: string[];
  project: string;
}

interface StoredRun {
  id: number;
  run_timestamp: string;
  test_name: string;
  file_path: string;
  status: string;
  duration_ms: number;
  error_message: string | null;
}

/**
 * JSON-file-backed trend store — no external DB dependencies required.
 * Stores each run as a line-delimited JSON (LDJ) file for append efficiency.
 */
export class TrendStore {
  private dbPath: string;
  private runs: StoredRun[] = [];
  private nextId = 1;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.load();
  }

  private load(): void {
    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.runs = parsed.runs ?? [];
        this.nextId = parsed.nextId ?? this.runs.length + 1;
      } catch {
        // Corrupt file — start fresh
        this.runs = [];
        this.nextId = 1;
      }
    }
  }

  private persist(): void {
    fs.writeFileSync(
      this.dbPath,
      JSON.stringify({ runs: this.runs, nextId: this.nextId }, null, 2),
    );
  }

  insertResults(results: TestResult[], runTimestamp: string): void {
    const inserts = results.map((r) => ({
      id: this.nextId++,
      run_timestamp: runTimestamp,
      test_name: r.testName,
      file_path: r.filePath,
      status: r.status,
      duration_ms: r.duration,
      error_message: r.errors.length > 0 ? r.errors.join(' | ') : null,
    }));
    this.runs.push(...inserts);
    this.persist();
  }

  queryFlakeRate(testName: string, sinceDays: number): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - sinceDays);
    const cutoffStr = cutoff.toISOString();

    const runs = this.runs.filter((r) => r.test_name === testName && r.run_timestamp >= cutoffStr);

    if (runs.length === 0) return 0;

    const passCount = runs.filter((r) => r.status === 'passed').length;
    const passRate = passCount / runs.length;
    return 1 - passRate;
  }

  querySlowestTests(limit: number): Array<{ testName: string; avgDuration: number }> {
    // Group by test name, compute average duration
    const map = new Map<string, { total: number; count: number }>();

    for (const run of this.runs) {
      const existing = map.get(run.test_name) ?? { total: 0, count: 0 };
      existing.total += run.duration_ms;
      existing.count += 1;
      map.set(run.test_name, existing);
    }

    return Array.from(map.entries())
      .map(([testName, { total, count }]) => ({
        testName,
        avgDuration: Math.round(total / count),
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }
}
