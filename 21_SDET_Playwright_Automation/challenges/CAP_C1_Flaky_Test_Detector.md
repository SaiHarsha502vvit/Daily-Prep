# Capstone C1 — Flaky-Test Detector CLI

> Build a CLI tool that analyses Playwright JSON reports, identifies flaky tests, and outputs a ranked quarantine list.

## Why this exists

Every SDET team eventually hits flake noise. Most react with "rerun until green," which hides the problem. A flaky-test detector turns flakes into a number you can fix. Senior teams build this. You're going to build it.

## What you ship

A standalone CLI tool, written in TypeScript, published as a public GitHub repo.

```
playwright-flake-detector/
├── src/
│   ├── cli.ts                 ← argument parsing
│   ├── ingest/json-reader.ts  ← reads Playwright JSON reports
│   ├── analyse/flake-score.ts ← scoring algorithm
│   ├── analyse/group-by.ts    ← group by file/test/project
│   ├── output/markdown.ts     ← writes report.md
│   └── output/json.ts         ← writes report.json
├── tests/                     ← yes, the detector itself has tests
├── package.json
├── tsconfig.json
└── README.md                  ← installation, usage, screenshots
```

## Features (minimum)

1. **Ingestion** — accept a directory of Playwright JSON reports across N runs.
2. **Flake score** — for each test:
   - `pass_rate = passes / total_runs`
   - `flake_score = 1 - |pass_rate - 0.5| * 2` (peaks at 0.5 pass rate)
   - A test with 100% pass or 100% fail scores 0. A test that flips 50/50 scores 1.
3. **Quarantine recommendation** — tests with `flake_score > threshold` (default 0.3) and `total_runs >= 5` go to quarantine.
4. **Output** —
   - `report.md` with a ranked table
   - `report.json` machine-readable for CI gating
   - Exit code 1 if any test exceeds the critical threshold (default 0.5)

## Stretch features

- **Detect by error type** — group flakes by error message pattern (timeout vs locator vs assertion).
- **Trend mode** — accept reports from multiple days, show flake-score trend.
- **GitHub Action wrapper** — `.github/actions/flake-detect/` that any team can drop into their CI.
- **Web dashboard** — small React page reading `report.json`.

## Acceptance criteria

- CLI works from a clean clone: `npm install && npm link && playwright-flake-detector --reports ./reports`.
- Detector's own test suite has > 90% coverage of `analyse/`.
- README has:
  - Installation
  - Usage with a real example
  - Screenshot of `report.md`
  - "How the score works" math explanation
- Public GitHub repo, MIT licence, good commit history.

## What this teaches

- Building tools, not just using them — the senior SDET differentiator.
- Statistical reasoning about test stability.
- That CI is also a target you can write code for.

## Portfolio value

This is the single best repo you can show in an SDET interview. "I built a tool to measure and reduce test flakiness in our suite" is a strong opener.
