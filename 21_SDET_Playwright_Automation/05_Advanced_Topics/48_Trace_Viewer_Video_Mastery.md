# 48. Trace Artifacts — File Format, Programmatic Extraction & Retention Economics

**Navigation**: [← Previous: File Uploads & Downloads](./47_File_Uploads_Downloads_Media.md) | [Index](../../00_MASTER_INDEX.md) | [Next: Component Testing →](./49_Component_Testing_Playwright_CT.md)

**Cross-links:**
- [`Ch26: Flakiness Diagnosis`](./26_Flakiness_Diagnosis_and_Fixing.md) — Trace viewer for flakiness debugging (the consumer of this chapter)
- [`Ch46: Config Semantics`](./46_Playwright_Config_Deep_Dive.md) — `trace`, `video`, `screenshot` config fields
- [`Ch25: CI/CD Integration`](./25_CICD_Integration_GitHub_Azure.md) — Artifact upload in GitHub Actions

---

## 5W1H — Why This Chapter?

- **WHAT**: The internal structure of Playwright trace files, how to extract data programmatically, the economics of CI storage, and the analytical pipeline that turns raw traces into flakiness metrics.
- **WHY**: Ch26 teaches you to READ a trace interactively for debugging. This chapter teaches you to AUTOMATE that reading — extract failure signatures, compute trend metrics, and optimise your storage spend. The trace is not just a debugging tool; it is a **telemetry source**.
- **WHO**: SDETs building test health dashboards, optimising CI costs, or writing post-mortem playbooks.
- **WHEN**: After you have used the trace viewer interactively (Ch26) and before your CI storage bill becomes a line item.
- **HOW**: By dissecting the trace ZIP format, writing a trace parser, and defining a retention policy.

---

## 1. Anatomy of `trace.zip`

A trace file is a ZIP archive with a deterministic internal structure:

```
trace.zip
├── trace.trace        ← Action log (binary protobuf-ish format)
├── trace.network      ← HAR-like JSON of all HTTP requests/responses
├── trace.stacks       ← JavaScript stack traces for errors
└── resources/         ← Screenshots, snapshots, source maps
    ├── screenshot-*.png
    ├── snapshot-*.html
    └── frames/*.png
```

### The `trace.trace` File

This is a **Playwright-specific trace format** (not HAR, not standard). It encodes:

| Field | Type | Description |
|---|---|---|
| `actions[]` | Array | Every Playwright API call with timestamp |
| `action.type` | String | `click`, `fill`, `goto`, `expect`, etc. |
| `action.params` | Object | The arguments passed (selector, value, timeout) |
| `action.error` | Object \| null | Error details if the action failed |
| `action.duration` | Number | Wall-clock time in milliseconds |
| `metadata` | Object | Test name, project, worker index, start time |

**Important:** `trace.trace` is NOT a text file. You cannot `cat` it. It must be parsed by Playwright's internal trace model or the trace viewer.

### The `trace.network` File

This is a JSON file in **HAR (HTTP Archive) format**, extended with Playwright-specific fields:

```json
{
  "log": {
    "entries": [
      {
        "startedDateTime": "2024-06-01T12:00:00.000Z",
        "time": 234,
        "request": { "url": "/api/invoices", "method": "GET" },
        "response": { "status": 200, "content": { "size": 1024 } }
      }
    ]
  }
}
```

---

## 2. Programmatic Trace Parsing

Playwright does NOT export a public API for parsing trace files. However, the trace model is importable from internal modules (use at your own stability risk — may break in minor versions):

```typescript
// utils/parseTrace.ts
import { createTraceViewer } from 'playwright/lib/server/trace/viewer/traceModel';

export interface FailureSignature {
  testName: string;
  projectName: string;
  failedAction: string;
  selector?: string;
  errorMessage: string;
  duration: number;
}

/**
 * Extracts all failure signatures from a trace ZIP.
 * Returns empty array if no failures occurred.
 */
export async function extractFailures(tracePath: string): Promise<FailureSignature[]> {
  const traceModel = await createTraceViewer(tracePath);

  const failures: FailureSignature[] = [];

  for (const action of traceModel.actions) {
    if (action.error) {
      failures.push({
        testName: traceModel.metadata.testName ?? 'unknown',
        projectName: traceModel.metadata.projectName ?? 'unknown',
        failedAction: action.type,
        selector: action.params?.selector,
        errorMessage: action.error.message ?? String(action.error),
        duration: action.duration ?? 0,
      });
    }
  }

  return failures;
}
```

### Building a Flakiness Heat Map

```typescript
// utils/flakinessHeatMap.ts
import { extractFailures } from './parseTrace';
import * as fs from 'fs';
import * as path from 'path';

interface FlakinessReport {
  totalRuns: number;
  failures: number;
  topFailureActions: { action: string; count: number }[];
  topErrorMessages: { message: string; count: number }[];
}

export async function buildFlakinessReport(
  traceDir: string,
): Promise<FlakinessReport> {
  const traceFiles = fs
    .readdirSync(traceDir)
    .filter((f) => f.endsWith('.zip'));

  const allFailures: FailureSignature[] = [];
  for (const file of traceFiles) {
    const failures = await extractFailures(path.join(traceDir, file));
    allFailures.push(...failures);
  }

  // Aggregate by action type
  const actionCounts = allFailures.reduce((acc, f) => {
    acc[f.failedAction] = (acc[f.failedAction] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Aggregate by error message (truncated for grouping)
  const messageCounts = allFailures.reduce((acc, f) => {
    const key = f.errorMessage.substring(0, 80);  // First 80 chars as signature
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalRuns: traceFiles.length,
    failures: allFailures.length,
    topFailureActions: Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([action, count]) => ({ action, count })),
    topErrorMessages: Object.entries(messageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([message, count]) => ({ message, count })),
  };
}
```

---

## 3. Video vs Trace — Decision Theory

Both video and trace are debugging artifacts. They serve different purposes:

| Dimension | Video (.webm) | Trace (.zip) |
|---|---|---|
| **Size** | ~5–15 MB/min | ~1–3 MB/test |
| **Contains** | Pixel-perfect recording | DOM snapshots + network + console |
| **Best for** | Visual/animation bugs | Locator/debug logic bugs |
| **Parseable** | No (binary) | Yes (structured) |
| **CI-friendly** | Heavy | Moderate |
| **Cross-browser** | Yes | Yes |
| **Overhead** | High (encode every frame) | Medium (capture snapshots) |

### The Retention Matrix

```
What is the failure rate?
├── > 10% (unstable suite)
│   └── Use: trace='on-first-retry', video='off'
│       Reason: tracing is cheaper; video would be 90% waste
├── 2–10% (moderate flakiness)
│   └── Use: trace='retain-on-failure', video='retain-on-failure'
│       Reason: selective capture keeps costs low while providing both artifacts
└── < 2% (healthy suite)
    └── Use: trace='on-first-retry', video='off' (or 'on-first-retry' if budget allows)
        Reason: failures are rare; optimise for happy-path speed
```

---

## 4. CI Retention Economics

### Storage Cost Model

Assume:
- Suite size: 500 tests
- Failure rate: 5%
- Trace size: 2 MB/test
- Video size: 8 MB/test

| Strategy | Trace Count | Video Count | Daily Size (MB) | Monthly (GB) |
|---|---|---|---|---|
| `trace: 'on', video: 'on'` | 500 | 500 | 5,000 | 150 |
| `trace: 'on-first-retry', video: 'off'` | ~25 | 0 | 50 | 1.5 |
| `trace: 'retain-on-failure', video: 'retain-on-failure'` | ~25 | ~25 | 250 | 7.5 |

At GitHub Actions artifact storage pricing (~$0.25/GB/month), the difference between "everything" and "selective" is `$37.13/month` vs `$1.88/month`.

### The 7-Day Rule

```yaml
# GitHub Actions
- uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: test-results/
    retention-days: 7
```

**Rationale:** Most test failures are fixed within 48 hours. A 7-day retention window covers the "investigate → fix → verify" cycle. Nightly runs may extend to 14 days for trend analysis.

---

## 5. Trace-to-Slack Alerting

```typescript
// utils/slackAlert.ts
import { extractFailures } from './parseTrace';

export async function postTraceSummaryToSlack(
  tracePath: string,
  webhookUrl: string,
): Promise<void> {
  const failures = await extractFailures(tracePath);

  if (failures.length === 0) return;

  const blocks = failures.map((f) => ({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${f.testName}*\n❌ \`${f.failedAction}\` failed: ${f.errorMessage.substring(0, 200)}`,
    },
  }));

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });
}
```

---

## Quick Reference

| Artifact | Config Value | Size | Use Case |
|---|---|---|---|
| Trace | `trace: 'on-first-retry'` | 1–3 MB | Locator debugging, network analysis |
| Video | `video: 'retain-on-failure'` | 5–15 MB | Animation/visual regression debugging |
| Screenshot | `screenshot: 'only-on-failure'` | 0.1–0.5 MB | Quick visual triage |
| JSON Report | `reporter: ['json']` | 0.01 MB | Dashboard ingestion |
| HTML Report | `reporter: ['html']` | 0.5–2 MB | Human review |

---

## Navigation

**Previous:** [← File Uploads & Downloads](./47_File_Uploads_Downloads_Media.md)
**Next:** [Component Testing →](./49_Component_Testing_Playwright_CT.md)
