# Analytics Module

Playwright test result analytics: parse reports, store trends, and query flakiness.

## Setup

No external dependencies required — uses a JSON file as backing store.

```bash
# From framework root
node utilities/analytics/cli.js --help
```

## Commands

### Insert a report

```bash
node utilities/analytics/cli.js --insert --report ./test-results/results.json --db ./analytics.db
```

Parses the Playwright JSON report and appends all test results to the local database. Safe to run repeatedly — each invocation creates a new timestamped run.

### Flake report

```bash
# Flakiness over last 7 days (default)
node utilities/analytics/cli.js --flake-report --db ./analytics.db

# Over last 30 days
node utilities/analytics/cli.js --flake-report --since 30d --db ./analytics.db
```

Prints tests ranked by flake rate (1 - pass rate). A test with 20% flake rate fails 20% of the time on average.

```
  %FLAKE  │ TEST NAME
  ────────┼─────────────────────────────────────────────────
   25.0%  │ should login with valid credentials
   10.0%  │ should load dashboard
```

### Slowest tests

```bash
# Top 10 slowest (default)
node utilities/analytics/cli.js --slowest --db ./analytics.db

# Top 5
node utilities/analytics/cli.js --slowest --limit 5 --db ./analytics.db
```

```
  AVG (ms) │ TEST NAME
  ─────────┼─────────────────────────────────────────────────
     3204  │ should upload large file
     1890  │ should generate report
```

## Architecture

```
analytics/
├── report-parser.ts   # Parse Playwright JSON → TestResult[]
├── trend-store.ts     # JSON-file-backed TrendStore
├── cli.ts             # CLI entrypoint
└── README.md
```

### `TestResult` interface

```typescript
interface TestResult {
  testName: string;
  filePath: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number; // milliseconds
  errors: string[];
  project: string;
}
```

### `TrendStore` API

```typescript
import { TrendStore } from './trend-store';

const store = new TrendStore('./analytics.db');

// Insert results from a parsed report
store.insertResults(results, '2026-06-09T16:00:00.000Z');

// Query flake rate (0.0 = never fails, 1.0 = always fails)
const flakeRate = store.queryFlakeRate('should login', 7); // last 7 days

// Slowest tests by average duration
const slowest = store.querySlowestTests(10);
```

## Storage format

The JSON store is a single file (e.g., `analytics.db`) — no server required, safe for local/CI use:

```json
{
  "runs": [
    { "id": 1, "run_timestamp": "...", "test_name": "...", "status": "passed", "duration_ms": 1234 }
  ],
  "nextId": 2
}
```

## CI integration

Add to your CI pipeline after tests run:

```bash
# Insert results
node utilities/analytics/cli.js \
  --insert \
  --report ./test-results/results.json \
  --db ./analytics.db

# Fail CI if flakiness detected
flake_rate=$(node utilities/analytics/cli.js --flake-report --db ./analytics.db | grep "should critical path" | awk '{print $1}')
if (( $(echo "$flake_rate > 0.05" | bc -l) )); then
  echo "Flake rate ${flake_rate} exceeds threshold"
  exit 1
fi
```
