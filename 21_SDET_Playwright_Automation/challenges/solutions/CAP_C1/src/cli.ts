#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { readJsonReports } from "./ingest/json-reader";
import {
  calculateFlakeScores,
  calculateGroupScores,
  TestSummary,
} from "./analyse/flake-score";
import {
  groupByErrorMessage,
  groupByFile,
  groupByProject,
} from "./analyse/group-by";
import { buildMarkdownReport } from "./output/markdown";
import { buildJsonReport } from "./output/json";

interface Args {
  reports: string;
  threshold: number;
  critical: number;
  outputDir: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  let reports = "./playwright-report";
  let threshold = 0.3;
  let critical = 0.5;
  let outputDir = "./flake-report";

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--reports":
        reports = args[++i] ?? reports;
        break;
      case "--threshold":
        threshold = parseFloat(args[++i] ?? String(threshold));
        break;
      case "--critical":
        critical = parseFloat(args[++i] ?? String(critical));
        break;
      case "--output-dir":
        outputDir = args[++i] ?? outputDir;
        break;
      case "--help":
      case "-h":
        console.log(`Usage: playwright-flake-detector [options]
Options:
  --reports <dir>      Directory containing Playwright JSON reports (default: ./playwright-report)
  --threshold <n>      Quarantine threshold 0-1 (default: 0.3)
  --critical <n>       Critical threshold 0-1 (default: 0.5)
  --output-dir <dir>   Output directory (default: ./flake-report)
  --help, -h           Show this help`);
        process.exit(0);
    }
  }

  return { reports, threshold, critical, outputDir };
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main(): void {
  const { reports: reportsDir, threshold, critical, outputDir } = parseArgs();

  console.error(`[flake-detector] Reading reports from: ${reportsDir}`);
  const rawReports = readJsonReports(reportsDir);
  console.error(`[flake-detector] Loaded ${rawReports.length} report file(s)`);

  const tests: TestSummary[] = calculateFlakeScores(rawReports, critical);
  console.error(`[flake-detector] Analysed ${tests.length} unique test(s)`);

  const criticalTests = tests.filter((t) => t.isCritical);
  const quarTests = tests.filter(
    (t) => !t.isCritical && t.flakeScore > threshold,
  );

  // Build groups
  const groups = [
    ...calculateGroupScores(tests, (t) => {
      const m = t.name.match(/^.*[/\\]([^/\\]+)\.(spec|test)\.[tj]s/);
      return m ? `file:${m[0]}` : "file:unknown";
    }),
    ...calculateGroupScores(tests, (t) => {
      const m = t.name.match(/\[([^\]]+)\]$/);
      return `project:${m ? m[1] : "default"}`;
    }),
  ];

  // Write outputs
  ensureDir(outputDir);

  const mdContent = buildMarkdownReport(tests, critical, threshold);
  const mdPath = path.join(outputDir, "report.md");
  fs.writeFileSync(mdPath, mdContent, "utf-8");
  console.error(`[flake-detector] Wrote: ${mdPath}`);

  const jsonReport = buildJsonReport(tests, groups, critical, threshold);
  const jsonPath = path.join(outputDir, "report.json");
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2), "utf-8");
  console.error(`[flake-detector] Wrote: ${jsonPath}`);

  // Summary output
  console.log(`\nFlaky Test Detection Complete`);
  console.log(`  Total:   ${tests.length}`);
  console.log(`  🔴 Critical:   ${criticalTests.length}`);
  console.log(`  🟡 Quarantine: ${quarTests.length}`);
  console.log(
    `  ✅ Healthy:    ${tests.length - criticalTests.length - quarTests.length}`,
  );

  if (criticalTests.length > 0) {
    console.log(
      `\n⚠️  ${criticalTests.length} test(s) exceed critical threshold (${critical})`,
    );
    console.log("   These tests should be fixed before merging.\n");
    process.exit(1);
  }

  process.exit(0);
}

main();
