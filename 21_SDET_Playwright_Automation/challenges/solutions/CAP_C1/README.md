# playwright-flake-detector

Detect and rank flaky Playwright tests from JSON reports. Outputs a ranked quarantine list and machine-readable JSON for CI gating.

## Installation

```bash
npm install
npm link
```

`npm link` makes `playwright-flake-detector` available globally. Or run it directly with `npx`.

## Usage

```bash
playwright-flake-detector --reports ./playwright-report
```

**All options:**

| Flag                 | Default               | Description                                             |
| -------------------- | --------------------- | ------------------------------------------------------- |
| `--reports <dir>`    | `./playwright-report` | Directory containing Playwright JSON reports            |
| `--threshold <n>`    | `0.3`                 | Quarantine threshold (0–1)                              |
| `--critical <n>`     | `0.5`                 | Critical threshold — exit code 1 if any test exceeds it |
| `--output-dir <dir>` | `./flake-report`      | Where to write report files                             |
| `--help`             |                       | Show help                                               |

## Output

Writes two files into `--output-dir`:

- **`report.md`** — ranked markdown table with sections for Critical, Quarantine, and Healthy tests
- **`report.json`** — machine-readable report with full scores, groups, and summary metadata

Exit code is `1` if any test exceeds the critical threshold, allowing CI to block merges on flaky tests.

## How the flake score works

The flake score measures how close a test is to a 50/50 pass/fail split — the hallmark of a flaky test.

```
pass_rate = passes / total_runs
flake_score = 1 - |pass_rate - 0.5| * 2
```

| Pass Rate | Flake Score | Interpretation                      |
| --------- | ----------- | ----------------------------------- |
| 100%      | 0.0         | Perfect — always passes             |
| 0%        | 0.0         | Perfect — always fails (but fix it) |
| 50%       | 1.0         | Maximum flakiness — coin flip       |
| 80%       | 0.4         | Mostly stable                       |
| 20%       | 0.4         | Mostly stable (mirror of 80%)       |

A test is flagged **critical** when:

- `flake_score > critical_threshold` **AND**
- `total_runs >= 5` (enough data to be statistically meaningful)

A test is flagged **quarantine** when:

- `flake_score > quarantine_threshold` **AND**
- `total_runs >= 5`

## Sample `report.md`

```
# 🧪 Playwright Flaky Test Report

> Generated: 2025-06-10T12:00:00.000Z

**Thresholds** — Critical: `>0.5` | Quarantine: `>0.3`

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | 24 |
| Total Runs | 312 |
| Overall Pass Rate | 84.6% |
| 🔴 Critical | 2 |
| 🟡 Quarantine | 7 |

## 🔴 Critical — Fix Immediately (2)

| Test | Pass Rate | Flake Score | Status |
|------|-----------|-------------|--------|
| checkout flow [auth] | 50.0% | **🔴 1.000** | 🔴 CRITICAL |
| payment validation [smoke] | 60.0% | **🔴 0.800** | 🔴 CRITICAL |

## 🟡 Quarantine Recommended (7)

| Test | Pass Rate | Flake Score | Status |
|------|-----------|-------------|--------|
| login retry [auth] | 40.0% | **🟡 0.800** | 🟡 QUARANTINE |
| ...
```

## Architecture

```
src/
├── cli.ts                 # Argument parsing and orchestration
├── ingest/
│   └── json-reader.ts     # Reads and validates Playwright JSON reports
├── analyse/
│   ├── flake-score.ts     # Core flake score algorithm
│   └── group-by.ts        # Grouping by file, project, or error pattern
└── output/
    ├── markdown.ts        # Human-readable report.md
    └── json.ts            # Machine-readable report.json
```

## License

MIT
