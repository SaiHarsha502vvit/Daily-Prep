import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { z } from "zod";
import { initDatabase, query, getClient } from "./db";

// Zod schema for Playwright JSON report structure
const TestResultSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  fullTitle: z.string().optional(),
  file: z.string().optional(),
  line: z.number().optional(),
  column: z.number().optional(),
  status: z.enum(["passed", "failed", "skipped", "timedOut", "interrupted"]),
  duration: z.number().optional(), // milliseconds
  error: z
    .object({
      message: z.string(),
      stack: z.string().optional(),
    })
    .optional()
    .nullable(),
  annotations: z.array(z.any()).optional(),
  retries: z.number().optional(),
  owner: z.string().optional(), // custom field for ownership
});

const PlaywrightReportSchema = z.object({
  config: z
    .object({
      reportDir: z.string().optional(),
      snapshotDir: z.string().optional(),
    })
    .optional(),
  project: z
    .object({
      name: z.string().optional(),
      id: z.string().optional(),
    })
    .optional(),
  suite: z
    .object({
      title: z.string(),
      file: z.string().optional(),
    })
    .optional(),
  results: z
    .array(
      z.object({
        runner: z
          .object({
            logSvg: z.string().optional(),
            link: z.string().optional(),
          })
          .optional(),
        config: z.any().optional(),
        project: z.any().optional(),
        suite: z.any().optional(),
        errors: z.array(z.any()).optional(),
        tests: z.array(TestResultSchema),
        stats: z
          .object({
            duration: z.number().optional(),
            suites: z.number().optional(),
            tests: z.number().optional(),
            passed: z.number().optional(),
            failed: z.number().optional(),
            skipped: z.number().optional(),
            unknown: z.number().optional(),
            timedOut: z.number().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
  // Simple flattened format also accepted
  tests: z.array(TestResultSchema).optional(),
  stats: z
    .object({
      duration: z.number().optional(),
      passed: z.number().optional(),
      failed: z.number().optional(),
      skipped: z.number().optional(),
    })
    .optional(),
});

export type PlaywrightReport = z.infer<typeof PlaywrightReportSchema>;
export type TestResult = z.infer<typeof TestResultSchema>;
export type RunSummary = z.infer<typeof RunSummarySchema>;

// Simplified run summary schema returned by API
const RunSummarySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  branch: z.string().nullable(),
  commitSha: z.string().nullable(),
  workflowName: z.string().nullable(),
  runNumber: z.number().nullable(),
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// POST /api/runs — ingest a Playwright JSON report
app.post("/api/runs", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.INGESTER_TOKEN || "dev-token";

  if (authHeader !== `Bearer ${expectedToken}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = PlaywrightReportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({
      error: "Invalid Playwright report format",
      details: parsed.error.flatten(),
    });
    return;
  }

  const report = parsed.data;
  const runId = (report as any).id || generateUUID();
  const timestamp = (report as any).timestamp || new Date().toISOString();
  const branch = (report as any).branch || process.env.GITHUB_REF_NAME || null;
  const commitSha = (report as any).commitSha || process.env.GITHUB_SHA || null;
  const workflowName =
    (report as any).workflowName || process.env.GITHUB_WORKFLOW || null;
  const runNumber = (report as any).runNumber
    ? parseInt((report as any).runNumber, 10)
    : null;

  // Extract tests from various possible report formats
  const rawTests = extractTests(report);
  const tests: TestResult[] = rawTests.map((t) => TestResultSchema.parse(t));

  const client = await getClient();
  try {
    await client.query("BEGIN");

    // Upsert run (idempotent)
    await client.query(
      `INSERT INTO runs (id, timestamp, branch, commit_sha, workflow_name, run_number, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (id) DO UPDATE SET
         timestamp = EXCLUDED.timestamp,
         branch = EXCLUDED.branch,
         commit_sha = EXCLUDED.commit_sha,
         workflow_name = EXCLUDED.workflow_name,
         run_number = EXCLUDED.run_number,
         updated_at = NOW()`,
      [runId, timestamp, branch, commitSha, workflowName, runNumber],
    );

    // Delete existing tests for this run (for idempotent re-upload)
    await client.query("DELETE FROM tests WHERE run_id = $1", [runId]);

    // Insert tests
    for (const test of tests) {
      const filePath =
        test.file || test.line !== undefined
          ? `${test.file}:${test.line}`
          : null;
      await client.query(
        `INSERT INTO tests (run_id, test_name, file_path, status, duration_ms, error_message, error_stack, owner)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          runId,
          test.fullTitle || test.title,
          filePath,
          test.status,
          test.duration ?? 0,
          test.error?.message ?? null,
          test.error?.stack ?? null,
          test.owner ?? null,
        ],
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ runId, testCount: tests.length });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error ingesting report:", err);
    res.status(500).json({ error: "Failed to ingest report" });
  } finally {
    client.release();
  }
});

// GET /api/overview — dashboard overview data
app.get("/api/overview", async (_req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Total runs
    const runsResult = await query<{ count: string }>(
      "SELECT COUNT(*) as count FROM runs WHERE timestamp >= $1",
      [thirtyDaysAgo],
    );
    const totalRuns = parseInt(runsResult[0]?.count || "0", 10);

    // Pass rate
    const passRateResult = await query<{ passed: string; total: string }>(
      `SELECT
         COUNT(CASE WHEN t.status = 'passed' THEN 1 END) as passed,
         COUNT(*) as total
       FROM tests t
       JOIN runs r ON t.run_id = r.id
       WHERE r.timestamp >= $1`,
      [thirtyDaysAgo],
    );
    const passed = parseInt(passRateResult[0]?.passed || "0", 10);
    const total = parseInt(passRateResult[0]?.total || "0", 10);
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    // Top 10 failing tests
    const failingTests = await query<{
      test_name: string;
      fail_count: string;
      pass_count: string;
      avg_duration_ms: string;
    }>(
      `SELECT
         t.test_name,
         COUNT(CASE WHEN t.status = 'failed' THEN 1 END) as fail_count,
         COUNT(CASE WHEN t.status = 'passed' THEN 1 END) as pass_count,
         COALESCE(AVG(t.duration_ms), 0)::int as avg_duration_ms
       FROM tests t
       JOIN runs r ON t.run_id = r.id
       WHERE r.timestamp >= $1
       GROUP BY t.test_name
       HAVING COUNT(CASE WHEN t.status = 'failed' THEN 1 END) > 0
       ORDER BY fail_count DESC, avg_duration_ms DESC
       LIMIT 10`,
      [thirtyDaysAgo],
    );

    // Top 10 slowest tests (by avg duration)
    const slowestTests = await query<{
      test_name: string;
      avg_duration_ms: string;
      run_count: string;
    }>(
      `SELECT
         t.test_name,
         COALESCE(AVG(t.duration_ms), 0)::int as avg_duration_ms,
         COUNT(*) as run_count
       FROM tests t
       JOIN runs r ON t.run_id = r.id
       WHERE r.timestamp >= $1
       GROUP BY t.test_name
       ORDER BY avg_duration_ms DESC
       LIMIT 10`,
      [thirtyDaysAgo],
    );

    res.json({
      totalRuns,
      passRate,
      failingTests: failingTests.map((t) => ({
        name: t.test_name,
        failCount: parseInt(t.fail_count, 10),
        passCount: parseInt(t.pass_count, 10),
        avgDurationMs: parseInt(t.avg_duration_ms, 10),
      })),
      slowestTests: slowestTests.map((t) => ({
        name: t.test_name,
        avgDurationMs: parseInt(t.avg_duration_ms, 10),
        runCount: parseInt(t.run_count, 10),
      })),
    });
  } catch (err) {
    console.error("Error fetching overview:", err);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
});

// GET /api/tests/:name — test detail (pass/fail history)
app.get("/api/tests/:name", async (req: Request, res: Response) => {
  const { name } = req.params;
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  try {
    const history = await query<{
      run_id: string;
      timestamp: string;
      branch: string;
      status: string;
      duration_ms: number;
      error_message: string | null;
    }>(
      `SELECT t.run_id, r.timestamp, r.branch, t.status, t.duration_ms, t.error_message
       FROM tests t
       JOIN runs r ON t.run_id = r.id
       WHERE t.test_name = $1 AND r.timestamp >= $2
       ORDER BY r.timestamp DESC
       LIMIT 100`,
      [name, thirtyDaysAgo],
    );

    const branchHistory = history.reduce<Record<string, typeof history>>(
      (acc, row) => {
        const branch = row.branch || "unknown";
        if (!acc[branch]) acc[branch] = [];
        acc[branch].push(row);
        return acc;
      },
      {},
    );

    res.json({
      testName: name,
      branches: Object.entries(branchHistory).map(([branch, rows]) => ({
        branch,
        history: rows.map((r) => ({
          runId: r.run_id,
          timestamp: r.timestamp,
          status: r.status,
          durationMs: r.duration_ms,
          errorMessage: r.error_message,
        })),
      })),
    });
  } catch (err) {
    console.error("Error fetching test detail:", err);
    res.status(500).json({ error: "Failed to fetch test detail" });
  }
});

// GET /api/owners/:name — owner summary
app.get("/api/owners/:name", async (req: Request, res: Response) => {
  const { name } = req.params;
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  try {
    // Owner test counts and failure rates
    const summary = await query<{
      total: string;
      passed: string;
      failed: string;
      skipped: string;
      avg_duration_ms: string;
    }>(
      `SELECT
         COUNT(*) as total,
         COUNT(CASE WHEN t.status = 'passed' THEN 1 END) as passed,
         COUNT(CASE WHEN t.status = 'failed' THEN 1 END) as failed,
         COUNT(CASE WHEN t.status = 'skipped' THEN 1 END) as skipped,
         COALESCE(AVG(t.duration_ms), 0)::int as avg_duration_ms
       FROM tests t
       JOIN runs r ON t.run_id = r.id
       WHERE t.owner = $1 AND r.timestamp >= $2`,
      [name, thirtyDaysAgo],
    );

    // Tests not run in 30 days (by owner, based on last seen)
    const lastSeen = await query<{ test_name: string; last_run: string }>(
      `SELECT t.test_name, MAX(r.timestamp) as last_run
       FROM tests t
       JOIN runs r ON t.run_id = r.id
       WHERE t.owner = $1
       GROUP BY t.test_name
       HAVING MAX(r.timestamp) < $2`,
      [name, thirtyDaysAgo],
    );

    // Top failing tests for this owner
    const topFailing = await query<{
      test_name: string;
      fail_count: string;
    }>(
      `SELECT t.test_name, COUNT(*) as fail_count
       FROM tests t
       JOIN runs r ON t.run_id = r.id
       WHERE t.owner = $1 AND t.status = 'failed' AND r.timestamp >= $2
       GROUP BY t.test_name
       ORDER BY fail_count DESC
       LIMIT 10`,
      [name, thirtyDaysAgo],
    );

    const s = summary[0];
    res.json({
      owner: name,
      totalTests: parseInt(s?.total || "0", 10),
      passed: parseInt(s?.passed || "0", 10),
      failed: parseInt(s?.failed || "0", 10),
      skipped: parseInt(s?.skipped || "0", 10),
      passRate:
        parseInt(s?.total || "0", 10) > 0
          ? Math.round(
              (parseInt(s?.passed || "0", 10) / parseInt(s?.total || "0", 10)) *
                100,
            )
          : 0,
      avgDurationMs: parseInt(s?.avg_duration_ms || "0", 10),
      notRunIn30Days: lastSeen.map((r) => ({
        testName: r.test_name,
        lastRun: r.last_run,
      })),
      topFailing: topFailing.map((t) => ({
        name: t.test_name,
        failCount: parseInt(t.fail_count, 10),
      })),
    });
  } catch (err) {
    console.error("Error fetching owner summary:", err);
    res.status(500).json({ error: "Failed to fetch owner summary" });
  }
});

// GET /api/owners — list all owners
app.get("/api/owners", async (_req: Request, res: Response) => {
  try {
    const owners = await query<{ owner: string; test_count: string }>(
      `SELECT owner, COUNT(*) as test_count
       FROM tests
       WHERE owner IS NOT NULL AND owner != ''
       GROUP BY owner
       ORDER BY test_count DESC`,
    );
    res.json({
      owners: owners.map((o) => ({
        name: o.owner,
        testCount: parseInt(o.test_count, 10),
      })),
    });
  } catch (err) {
    console.error("Error fetching owners:", err);
    res.status(500).json({ error: "Failed to fetch owners" });
  }
});

// GET /api/runs — list recent runs
app.get("/api/runs", async (req: Request, res: Response) => {
  const limit = Math.min(
    parseInt((req.query.limit as string) || "20", 10),
    100,
  );
  try {
    const runs = await query<{
      id: string;
      timestamp: string;
      branch: string;
      commit_sha: string;
      workflow_name: string;
      run_number: number;
      test_count: string;
    }>(
      `SELECT r.id, r.timestamp, r.branch, r.commit_sha, r.workflow_name, r.run_number,
              COUNT(t.id) as test_count
       FROM runs r
       LEFT JOIN tests t ON t.run_id = r.id
       GROUP BY r.id
       ORDER BY r.timestamp DESC
       LIMIT $1`,
      [limit],
    );
    res.json({
      runs: runs.map((r) => ({
        id: r.id,
        timestamp: r.timestamp,
        branch: r.branch,
        commitSha: r.commit_sha,
        workflowName: r.workflow_name,
        runNumber: r.run_number,
        testCount: parseInt(r.test_count, 10),
      })),
    });
  } catch (err) {
    console.error("Error fetching runs:", err);
    res.status(500).json({ error: "Failed to fetch runs" });
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

function extractTests(report: PlaywrightReport): unknown[] {
  // Handle various Playwright report formats
  if (report.tests && Array.isArray(report.tests)) {
    return report.tests;
  }
  if (report.results && Array.isArray(report.results)) {
    return report.results.flatMap((r) => r.tests || []);
  }
  return [];
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Start server
const PORT = parseInt(process.env.PORT || "3001", 10);

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Ingester server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

export default app;
