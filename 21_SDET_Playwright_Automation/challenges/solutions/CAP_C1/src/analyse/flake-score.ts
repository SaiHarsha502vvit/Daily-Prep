import { PlaywrightReport } from "../ingest/json-reader";

export interface TestRun {
  name: string;
  status: "passed" | "failed" | "skipped" | "timedOut" | "interrupted";
  duration: number;
  errors: string[];
  passes: number;
  totalRuns: number;
}

export interface TestSummary {
  name: string;
  totalRuns: number;
  passes: number;
  passRate: number;
  flakeScore: number;
  avgDuration: number;
  isCritical: boolean;
  errors: string[];
}

export interface GroupScore {
  key: string;
  tests: TestSummary[];
  avgFlakeScore: number;
  passRate: number;
  totalRuns: number;
  passes: number;
}

/**
 * Deduplicate test runs by name across multiple reports.
 */
function mergeTestRuns(reports: PlaywrightReport[]): TestRun[] {
  const map = new Map<string, TestRun>();

  for (const report of reports) {
    for (const test of report.tests) {
      if (map.has(test.title)) {
        const existing = map.get(test.title)!;
        if (test.status === "passed") existing.passes++;
        existing.totalRuns++;
        existing.duration += test.duration;
        existing.errors.push(...test.errors);
      } else {
        map.set(test.title, {
          name: test.title,
          status: test.status,
          duration: test.duration,
          errors: [...test.errors],
          passes: test.status === "passed" ? 1 : 0,
          totalRuns: 1,
        });
      }
    }
  }

  return Array.from(map.values());
}

function computeFlakeScore(passRate: number): number {
  return 1 - Math.abs(passRate - 0.5) * 2;
}

/**
 * Calculate flake scores for all tests across merged runs.
 * A test is flagged critical if flake_score > criticalThreshold and total_runs >= 5.
 */
export function calculateFlakeScores(
  reports: PlaywrightReport[],
  criticalThreshold: number,
): TestSummary[] {
  const merged = mergeTestRuns(reports);

  return merged.map((run) => {
    const passRate = run.totalRuns > 0 ? run.passes / run.totalRuns : 0;
    const flakeScore = run.totalRuns >= 5 ? computeFlakeScore(passRate) : 0;
    const avgDuration = run.totalRuns > 0 ? run.duration / run.totalRuns : 0;

    return {
      name: run.name,
      totalRuns: run.totalRuns,
      passes: run.passes,
      passRate,
      flakeScore,
      avgDuration,
      isCritical: run.totalRuns >= 5 && flakeScore > criticalThreshold,
      errors: run.errors,
    };
  });
}

/**
 * Compute group-level scores from a set of test summaries.
 */
export function calculateGroupScores(
  tests: TestSummary[],
  groupFn: (test: TestSummary) => string,
): GroupScore[] {
  const groups = new Map<string, TestSummary[]>();

  for (const test of tests) {
    const key = groupFn(test);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(test);
  }

  return Array.from(groups.entries()).map(([key, groupTests]) => {
    const avgFlakeScore =
      groupTests.length > 0
        ? groupTests.reduce((sum, t) => sum + t.flakeScore, 0) /
          groupTests.length
        : 0;
    const totalPasses = groupTests.reduce((sum, t) => sum + t.passes, 0);
    const totalRuns = groupTests.reduce((sum, t) => sum + t.totalRuns, 0);
    const passRate = totalRuns > 0 ? totalPasses / totalRuns : 0;

    return {
      key,
      tests: groupTests,
      avgFlakeScore,
      passRate,
      totalRuns,
      passes: totalPasses,
    };
  });
}
