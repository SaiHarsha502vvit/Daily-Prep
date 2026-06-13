export interface TestMeta {
  owner?: string;
  jiraLink?: string;
  tags?: string[];
}

export interface SuiteSummary {
  total: number;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  duration: number;
}

export interface AggregatedResult {
  overall: SuiteSummary;
  byProject: Record<string, SuiteSummary>;
  byOwner: Record<string, SuiteSummary>;
  slowestTests: Array<{ title: string; duration: number; file: string }>;
  failedTests: Array<{ title: string; error: string; file: string }>;
}