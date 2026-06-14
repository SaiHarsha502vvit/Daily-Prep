import { TestSummary, GroupScore } from "../analyse/flake-score";

export interface JsonReport {
  metadata: {
    generatedAt: string;
    criticalThreshold: number;
    quarantineThreshold: number;
    totalTests: number;
    totalRuns: number;
    overallPassRate: number;
  };
  tests: Array<{
    name: string;
    totalRuns: number;
    passes: number;
    passRate: number;
    flakeScore: number;
    avgDuration: number;
    isCritical: boolean;
  }>;
  groups: GroupScore[];
  summary: {
    criticalCount: number;
    quarantineCount: number;
    healthyCount: number;
    avgFlakeScore: number;
    avgPassRate: number;
    avgDuration: number;
  };
}

export function buildJsonReport(
  tests: TestSummary[],
  groups: GroupScore[],
  criticalThreshold: number,
  quarantineThreshold: number,
): JsonReport {
  const sorted = [...tests].sort((a, b) => b.flakeScore - a.flakeScore);
  const critical = sorted.filter((t) => t.isCritical);
  const quar = sorted.filter(
    (t) => !t.isCritical && t.flakeScore > quarantineThreshold,
  );

  const totalRuns = tests.reduce((s, t) => s + t.totalRuns, 0);
  const totalPasses = tests.reduce((s, t) => s + t.passes, 0);
  const overallPassRate = totalRuns > 0 ? totalPasses / totalRuns : 0;

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      criticalThreshold,
      quarantineThreshold,
      totalTests: tests.length,
      totalRuns,
      overallPassRate,
    },
    tests: sorted.map((t) => ({
      name: t.name,
      totalRuns: t.totalRuns,
      passes: t.passes,
      passRate: t.passRate,
      flakeScore: t.flakeScore,
      avgDuration: t.avgDuration,
      isCritical: t.isCritical,
    })),
    groups,
    summary: {
      criticalCount: critical.length,
      quarantineCount: quar.length,
      healthyCount: tests.length - critical.length - quar.length,
      avgFlakeScore:
        tests.length > 0
          ? tests.reduce((s, t) => s + t.flakeScore, 0) / tests.length
          : 0,
      avgPassRate:
        tests.length > 0
          ? tests.reduce((s, t) => s + t.passRate, 0) / tests.length
          : 0,
      avgDuration:
        tests.length > 0
          ? tests.reduce((s, t) => s + t.avgDuration, 0) / tests.length
          : 0,
    },
  };
}
