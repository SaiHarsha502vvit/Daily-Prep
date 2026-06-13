import { TestSummary } from '../analyse/flake-score';

function statusBadge(test: TestSummary, criticalThreshold: number, quarantineThreshold: number): string {
  if (test.isCritical) return '🔴 CRITICAL';
  if (test.flakeScore > quarantineThreshold) return '🟡 QUARANTINE';
  return '✅ OK';
}

function scoreColor(score: number): string {
  if (score >= 0.7) return '**🔴 ' + score.toFixed(3) + '**';
  if (score >= 0.4) return '**🟡 ' + score.toFixed(3) + '**';
  return '**🟢 ' + score.toFixed(3) + '**';
}

export function generateMarkdownReport(
  tests: TestSummary[],
  criticalThreshold: number,
  quarantineThreshold: number,
  _outputDir: string
): string {
  const sorted = [...tests].sort((a, b) => b.flakeScore - a.flakeScore);
  const critical = sorted.filter(t => t.isCritical);
  const quarantine = sorted.filter(t => !t.isCritical && t.flakeScore > quarantineThreshold);
  const ok = sorted.filter(t => !t.isCritical && t.flakeScore <= quarantineThreshold);

  const totalRuns = tests.reduce((s, t) => s + t.totalRuns, 0);
  const totalPasses = tests.reduce((s, t) => s + t.passes, 0);
  const avgDuration = tests.length > 0
    ? tests.reduce((s, t) => s + t.avgDuration, 0) / tests.length
    : 0;

  let md = '# 🧪 Playwright Flaky Test Report\n\n';
  md += `> Generated: ${new Date().toISOString()}\n\n`;
  md += `**Thresholds** — Critical: \`>${criticalThreshold}\` | Quarantine: \`>${quarantineThreshold}\`\n\n`;
  md += '## Summary\n\n';
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Tests | ${tests.length} |\n`;
  md += `| Total Runs | ${totalRuns} |\n`;
  md += `| Overall Pass Rate | ${totalRuns > 0 ? ((totalPasses / totalRuns) * 100).toFixed(1) : 0}% |\n`;
  md += `| Avg Duration | ${avgDuration.toFixed(0)}ms |\n`;
  md += `| 🔴 Critical | ${critical.length} |\n`;
  md += `| 🟡 Quarantine | ${quarantine.length} |\n\n`;

  function section(title: string, rows: TestSummary[]): string {
    if (rows.length === 0) return '';
    let s = `## ${title} (${rows.length})\n\n`;
    s += '| Test | Pass Rate | Flake Score | Status |\n';
    s += '|------|-----------|-------------|--------|\n';
    for (const t of rows) {
      const passPct = (t.passRate * 100).toFixed(1) + '%';
      s += `| ${t.name} | ${passPct} | ${scoreColor(t.flakeScore)} | ${statusBadge(t, criticalThreshold, quarantineThreshold)} |\n`;
    }
    s += '\n';
    return s;
  }

  md += section('🔴 Critical — Fix Immediately', critical);
  md += section('🟡 Quarantine Recommended', quarantine);
  md += section('✅ Healthy Tests', ok.slice(0, 50));
  if (ok.length > 50) md += `> _${ok.length - 50} more healthy tests omitted_\n`;

  return md;
}

export function buildMarkdownReport(
  tests: TestSummary[],
  criticalThreshold: number,
  quarantineThreshold: number
): string {
  return generateMarkdownReport(tests, criticalThreshold, quarantineThreshold, '');
}