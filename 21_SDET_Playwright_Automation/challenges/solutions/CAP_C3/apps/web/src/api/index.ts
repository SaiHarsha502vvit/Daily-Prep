const INGESTER_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_INGESTER_URL || 'http://localhost:3001')
    : (process.env.NEXT_PUBLIC_INGESTER_URL || 'http://localhost:3001');

async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${INGESTER_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export interface OverviewData {
  totalRuns: number;
  passRate: number;
  failingTests: Array<{
    name: string;
    failCount: number;
    passCount: number;
    avgDurationMs: number;
  }>;
  slowestTests: Array<{
    name: string;
    avgDurationMs: number;
    runCount: number;
  }>;
}

export interface TestDetailData {
  testName: string;
  branches: Array<{
    branch: string;
    history: Array<{
      runId: string;
      timestamp: string;
      status: string;
      durationMs: number;
      errorMessage: string | null;
    }>;
  }>;
}

export interface OwnerSummary {
  owner: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  avgDurationMs: number;
  notRunIn30Days: Array<{ testName: string; lastRun: string }>;
  topFailing: Array<{ name: string; failCount: number }>;
}

export interface OwnerList {
  owners: Array<{ name: string; testCount: number }>;
}

export interface RunSummary {
  id: string;
  timestamp: string;
  branch: string | null;
  commitSha: string | null;
  workflowName: string | null;
  runNumber: number | null;
  testCount: number;
}

export interface RunsList {
  runs: RunSummary[];
}

export const api = {
  getOverview: () => fetcher<OverviewData>('/api/overview'),
  getTestDetail: (name: string) => fetcher<TestDetailData>(`/api/tests/${encodeURIComponent(name)}`),
  getOwnerSummary: (name: string) => fetcher<OwnerSummary>(`/api/owners/${encodeURIComponent(name)}`),
  getOwners: () => fetcher<OwnerList>('/api/owners'),
  getRuns: (limit = 20) => fetcher<RunsList>(`/api/runs?limit=${limit}`),
};