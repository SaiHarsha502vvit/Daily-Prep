#!/usr/bin/env node

/**
 * Analytics CLI for Playwright test reports.
 *
 * Usage:
 *   node utilities/analytics/cli.js --insert --report ./test-results/results.json --db ./analytics.db
 *   node utilities/analytics/cli.js --flake-report --since 7d --db ./analytics.db
 *   node utilities/analytics/cli.js --slowest --limit 10 --db ./analytics.db
 */

import { parsePlaywrightReport, type TestResult } from './report-parser';
import { TrendStore } from './trend-store';

interface CliArgs {
  insert?: boolean;
  'flake-report'?: boolean;
  slowest?: boolean;
  report?: string;
  db?: string;
  since?: string;
  limit?: string;
}

function parseArgs(): CliArgs {
  const args: CliArgs = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;
    if (arg === '--insert' || arg === '--flake-report' || arg === '--slowest') {
      (args as Record<string, unknown>)[arg.replace('--', '')] = true;
    } else {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        const key = arg.replace('--', '');
        if (['report', 'db', 'since', 'limit'].includes(key)) {
          (args as Record<string, unknown>)[key] = next;
          i++;
        }
      }
    }
  }
  return args;
}

function parseDays(s: string): number {
  const match = s.match(/^(\d+)d$/);
  return match ? parseInt(match[1] ?? '7', 10) : parseInt(s, 10) || 7;
}

function main(): void {
  const args = parseArgs();

  const dbPath = args.db ?? './analytics.db';
  const store = new TrendStore(dbPath);

  if (args['flake-report']) {
    const sinceDays = parseDays(args.since ?? '7d');
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - sinceDays);
    const cutoffStr = sinceDate.toISOString();

    // Collect all test names seen in window
    const testNames = [...new Set(store['runs'].filter(
      (r: { run_timestamp: string }) => r.run_timestamp >= cutoffStr
    ).map((r: { test_name: string }) => r.test_name))];

    const flakes = testNames
      .map((name) => ({ name, flakeRate: store.queryFlakeRate(name, sinceDays) }))
      .filter((x) => x.flakeRate > 0)
      .sort((a, b) => b.flakeRate - a.flakeRate);

    if (flakes.length === 0) {
      console.log(`No flakiness detected in the last ${sinceDays} days.`);
      return;
    }

    console.log(`\nFlaky tests (last ${sinceDays} days) — ranked by flake rate:\n`);
    console.log('  %FLAKE  │ TEST NAME');
    console.log('  ────────┼─────────────────────────────────────────────────');
    for (const { name, flakeRate } of flakes) {
      const pct = (flakeRate * 100).toFixed(1).padStart(5);
      console.log(`  ${pct}%  │ ${name}`);
    }
    console.log('');
  } else if (args.slowest) {
    const limit = parseInt(args.limit ?? '10', 10);
    const slowest = store.querySlowestTests(limit);

    if (slowest.length === 0) {
      console.log('No data in database yet. Run --insert first.');
      return;
    }

    console.log(`\nTop ${limit} slowest tests by average duration:\n`);
    console.log('  AVG (ms) │ TEST NAME');
    console.log('  ─────────┼─────────────────────────────────────────────────');
    for (const { testName, avgDuration } of slowest) {
      console.log(`  ${String(avgDuration).padStart(8)} │ ${testName}`);
    }
    console.log('');
  } else if (args.insert) {
    const reportPath = args.report;
    if (!reportPath) {
      console.error('Error: --insert requires --report <path>');
      process.exit(1);
    }

    let results: TestResult[];
    try {
      results = parsePlaywrightReport(reportPath);
    } catch (e) {
      console.error(`Failed to parse report: ${e}`);
      process.exit(1);
    }

    const timestamp = new Date().toISOString();
    store.insertResults(results, timestamp);

    const passed = results.filter((r) => r.status === 'passed').length;
    console.log(
      `\nInserted ${results.length} test results into ${dbPath} (${passed} passed, ${results.length - passed} failed/skipped) at ${timestamp}\n`
    );
  } else {
    console.log(`Analytics CLI

Commands:
  --insert --report <path> --db <db>     Insert a Playwright JSON report into the DB
  --flake-report --since <Nd> --db <db>  Show flaky tests ranked by flake rate
  --slowest --limit N --db <db>          Show slowest tests by average duration

Examples:
  node utilities/analytics/cli.js --insert --report ./test-results/results.json --db ./analytics.db
  node utilities/analytics/cli.js --flake-report --since 7d --db ./analytics.db
  node utilities/analytics/cli.js --slowest --limit 10 --db ./analytics.db
`);
  }
}

main();