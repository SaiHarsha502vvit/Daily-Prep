import * as fs from 'fs';
import * as path from 'path';
import { type Reporter, type FullConfig, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import { aggregate } from './data/aggregate';
import { renderHtml } from './render/html';
import type { AggregatedResult } from './types';

interface ReporterOptions {
  outputFolder?: string;
  outputFile?: string;
}

interface CollectedTest {
  title: string;
  file: string;
  projectName?: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted';
  duration: number;
  errors: string[];
  owner?: string;
  jiraLink?: string;
  tags: string[];
  resultsLength: number;
  lastResultPassed: boolean;
}

const allTests: CollectedTest[] = [];

function extractMeta(test: TestCase): { owner?: string; jiraLink?: string; tags: string[] } {
  const annotations = test.annotations;
  const tags: string[] = [];
  let owner: string | undefined;
  let jiraLink: string | undefined;

  for (const ann of annotations) {
    if (ann.type === 'owner') owner = ann.description;
    else if (ann.type === 'jira') jiraLink = ann.description;
    else if (ann.type === 'tag') tags.push(ann.description ?? '');
  }

  return { owner, jiraLink, tags };
}

class TeamReporter implements Reporter {
  private config!: FullConfig;
  private outputFolder = 'playwright-report';

  constructor(options: ReporterOptions = {}) {
    if (options.outputFolder) this.outputFolder = options.outputFolder;
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    allTests.length = 0;
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const meta = extractMeta(test);
    const isFlaky = result.retry > 0 && result.status === 'passed';
    const lastResultPassed = isFlaky; // if it passed on retry, it was flaky

    const statusMap: Record<string, CollectedTest['status']> = {
      passed: 'passed',
      failed: 'failed',
      skipped: 'skipped',
      timedOut: 'timedOut',
      interrupted: 'interrupted',
    };

    const errors: string[] = [];
    if (result.errors.length > 0) {
      for (const err of result.errors) {
        errors.push(err.message ?? '');
      }
    }
    if (result.error) {
      errors.push(result.error.message ?? '');
    }

    allTests.push({
      title: test.title,
      file: test.location.file,
      projectName: test.title.match(/^\[([^\]]+)\]/)?.[1], // extract project from [Project] title prefix
      status: statusMap[result.status] ?? 'failed',
      duration: result.duration,
      errors,
      owner: meta.owner,
      jiraLink: meta.jiraLink,
      tags: meta.tags,
      resultsLength: result.retry + 1,
      lastResultPassed,
    });
  }

  onEnd(result: { status: string }): void {
    const aggregated = aggregate([...allTests]);

    const outDir = path.resolve(this.outputFolder);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const html = renderHtml(aggregated, this.outputFolder);
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');

    const json: AggregatedResult & { generatedAt: string; status: string } = {
      ...aggregated,
      generatedAt: new Date().toISOString(),
      status: result.status,
    };
    fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(json, null, 2), 'utf-8');

    console.log(`\nTeam Reporter: Report written to ${outDir}/index.html`);
    console.log(
      `  Total: ${aggregated.overall.total} | ` +
        `Passed: ${aggregated.overall.passed} | ` +
        `Failed: ${aggregated.overall.failed} | ` +
        `Flaky: ${aggregated.overall.flaky} | ` +
        `Skipped: ${aggregated.overall.skipped}`
    );
  }
}

export default TeamReporter;
export { TeamReporter };
export type { ReporterOptions };