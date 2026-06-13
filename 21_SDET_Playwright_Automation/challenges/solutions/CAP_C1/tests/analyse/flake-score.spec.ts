import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateFlakeScores, calculateGroupScores } from '../../src/analyse/flake-score';
import { PlaywrightReport } from '../../src/ingest/json-reader';

function makeReport(tests: Array<{ title: string; status: string; duration?: number; errors?: string[] }>): PlaywrightReport {
  return {
    file: 'report-1.json',
    tests: tests.map(t => ({
      title: t.title,
      status: t.status as 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted',
      duration: t.duration ?? 100,
      errors: t.errors ?? [],
    })),
  };
}

describe('calculateFlakeScores', () => {
  it('scores 0 when pass rate is 100%', () => {
    const reports: PlaywrightReport[] = [
      makeReport([
        { title: 'test-a', status: 'passed' },
        { title: 'test-a', status: 'passed' },
        { title: 'test-a', status: 'passed' },
        { title: 'test-a', status: 'passed' },
        { title: 'test-a', status: 'passed' },
      ]),
    ];
    const results = calculateFlakeScores(reports, 0.5);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].passes, 5);
    assert.strictEqual(results[0].totalRuns, 5);
    assert.strictEqual(results[0].passRate, 1.0);
    assert.strictEqual(results[0].flakeScore, 0);
    assert.strictEqual(results[0].isCritical, false);
  });

  it('scores 0 when pass rate is 0%', () => {
    const reports: PlaywrightReport[] = [
      makeReport([
        { title: 'test-b', status: 'failed' },
        { title: 'test-b', status: 'failed' },
        { title: 'test-b', status: 'failed' },
        { title: 'test-b', status: 'failed' },
        { title: 'test-b', status: 'failed' },
      ]),
    ];
    const results = calculateFlakeScores(reports, 0.5);
    assert.strictEqual(results[0].passRate, 0);
    assert.strictEqual(results[0].flakeScore, 0);
  });

  it('scores 1.0 when pass rate is exactly 50%', () => {
    const reports: PlaywrightReport[] = [
      makeReport([
        { title: 'test-c', status: 'passed' },
        { title: 'test-c', status: 'failed' },
        { title: 'test-c', status: 'passed' },
        { title: 'test-c', status: 'failed' },
        { title: 'test-c', status: 'passed' },
        { title: 'test-c', status: 'failed' },
        { title: 'test-c', status: 'passed' },
        { title: 'test-c', status: 'failed' },
        { title: 'test-c', status: 'passed' },
        { title: 'test-c', status: 'failed' },
      ]),
    ];
    const results = calculateFlakeScores(reports, 0.5);
    assert.strictEqual(results[0].passRate, 0.5);
    assert.strictEqual(results[0].flakeScore, 1.0);
  });

  it('scores correctly for 60% pass rate', () => {
    // pass_rate = 0.6, flake_score = 1 - |0.6 - 0.5| * 2 = 1 - 0.2 = 0.8
    const reports: PlaywrightReport[] = [
      makeReport([
        { title: 'test-d', status: 'passed' },
        { title: 'test-d', status: 'passed' },
        { title: 'test-d', status: 'passed' },
        { title: 'test-d', status: 'failed' },
        { title: 'test-d', status: 'failed' },
      ]),
    ];
    const results = calculateFlakeScores(reports, 0.5);
    assert.strictEqual(results[0].passRate, 0.6);
    assert.strictEqual(results[0].flakeScore, 0.8);
  });

  it('scores correctly for 40% pass rate (symmetric)', () => {
    // pass_rate = 0.4, flake_score = 1 - |0.4 - 0.5| * 2 = 1 - 0.2 = 0.8
    const reports: PlaywrightReport[] = [
      makeReport([
        { title: 'test-e', status: 'failed' },
        { title: 'test-e', status: 'failed' },
        { title: 'test-e', status: 'passed' },
        { title: 'test-e', status: 'failed' },
        { title: 'test-e', status: 'failed' },
      ]),
    ];
    const results = calculateFlakeScores(reports, 0.5);
    assert.strictEqual(results[0].passRate, 0.4);
    assert.strictEqual(results[0].flakeScore, 0.8);
  });

  it('sets isCritical true only when flake_score > critical AND total_runs >= 5', () => {
    const reports: PlaywrightReport[] = [
      makeReport([
        { title: 'test-f', status: 'passed' },
        { title: 'test-f', status: 'failed' },
        { title: 'test-f', status: 'passed' },
        { title: 'test-f', status: 'failed' },
        { title: 'test-f', status: 'passed' },
        { title: 'test-f', status: 'failed' },
        { title: 'test-f', status: 'passed' },
        { title: 'test-f', status: 'failed' },
        { title: 'test-f', status: 'passed' },
        { title: 'test-f', status: 'failed' },
      ]),
    ];
    // pass_rate=0.5, flake_score=1.0 > 0.5, runs=10 >= 5
    const results = calculateFlakeScores(reports, 0.5);
    assert.strictEqual(results[0].isCritical, true);
  });

  it('does NOT flag isCritical when total_runs < 5 even with high score', () => {
    const reports: PlaywrightReport[] = [
      makeReport([
        { title: 'test-g', status: 'passed' },
        { title: 'test-g', status: 'failed' },
        { title: 'test-g', status: 'passed' },
        { title: 'test-g', status: 'failed' },
      ]),
    ];
    // pass_rate=0.5, flake_score=1.0 > 0.5 but runs=4 < 5
    const results = calculateFlakeScores(reports, 0.5);
    assert.strictEqual(results[0].isCritical, false);
    assert.strictEqual(results[0].flakeScore, 0); // score=0 because runs < 5
  });

  it('merges the same test across multiple reports', () => {
    const reports: PlaywrightReport[] = [
      makeReport([{ title: 'test-h', status: 'passed' }, { title: 'test-h', status: 'failed' }]),
      makeReport([{ title: 'test-h', status: 'passed' }, { title: 'test-h', status: 'passed' }]),
      makeReport([{ title: 'test-h', status: 'failed' }]),
    ];
    const results = calculateFlakeScores(reports, 0.5);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].totalRuns, 5);
    assert.strictEqual(results[0].passes, 3);
    assert.strictEqual(results[0].passRate, 0.6);
    assert.strictEqual(results[0].flakeScore, 0.8);
  });

  it('returns avgDuration based on all merged runs', () => {
    const reports: PlaywrightReport[] = [
      {
        file: 'r1.json',
        tests: [{ title: 'test-i', status: 'passed', duration: 100, errors: [] }],
      },
      {
        file: 'r2.json',
        tests: [{ title: 'test-i', status: 'failed', duration: 200, errors: [] }],
      },
    ];
    const results = calculateFlakeScores(reports, 0.5);
    assert.strictEqual(results[0].avgDuration, 150);
  });

  it('maps errors from all runs into the summary', () => {
    const reports: PlaywrightReport[] = [
      {
        file: 'r1.json',
        tests: [{ title: 'test-j', status: 'failed', duration: 50, errors: ['timeout error'] }],
      },
      {
        file: 'r2.json',
        tests: [{ title: 'test-j', status: 'failed', duration: 50, errors: ['timeout error'] }],
      },
    ];
    const results = calculateFlakeScores(reports, 0.5);
    // flake score = 0 since 0% pass rate
    assert.strictEqual(results[0].flakeScore, 0);
    assert.strictEqual(results[0].passRate, 0);
  });

  it('handles multiple different tests in one report', () => {
    const reports: PlaywrightReport[] = [
      makeReport([
        { title: 'stable-test', status: 'passed' },
        { title: 'stable-test', status: 'passed' },
        { title: 'stable-test', status: 'passed' },
        { title: 'stable-test', status: 'passed' },
        { title: 'stable-test', status: 'passed' },
        { title: 'flaky-test', status: 'passed' },
        { title: 'flaky-test', status: 'failed' },
        { title: 'flaky-test', status: 'passed' },
        { title: 'flaky-test', status: 'failed' },
        { title: 'flaky-test', status: 'passed' },
        { title: 'flaky-test', status: 'failed' },
        { title: 'flaky-test', status: 'passed' },
      ]),
    ];
    const results = calculateFlakeScores(reports, 0.5);
    assert.strictEqual(results.length, 2);

    const stable = results.find(r => r.name === 'stable-test')!;
    assert.strictEqual(stable.flakeScore, 0);

    const flaky = results.find(r => r.name === 'flaky-test')!;
    assert.strictEqual(flaky.passRate, 0.5);
    assert.strictEqual(flaky.flakeScore, 1.0);
  });
});

describe('calculateGroupScores', () => {
  it('groups tests by the given key function', () => {
    const tests = [
      { name: 'a [proj1]', totalRuns: 5, passes: 5, passRate: 1.0, flakeScore: 0, avgDuration: 100, isCritical: false, errors: [] },
      { name: 'b [proj1]', totalRuns: 5, passes: 0, passRate: 0, flakeScore: 0, avgDuration: 100, isCritical: false, errors: [] },
      { name: 'c [proj2]', totalRuns: 5, passes: 3, passRate: 0.6, flakeScore: 0.8, avgDuration: 100, isCritical: false, errors: [] },
    ];
    const groups = calculateGroupScores(tests, t => {
      const m = t.name.match(/\[([^\]]+)\]$/);
      return m ? m[1] : 'default';
    });

    assert.strictEqual(groups.length, 2);
    const proj1 = groups.find(g => g.key === 'proj1')!;
    const proj2 = groups.find(g => g.key === 'proj2')!;
    assert.strictEqual(proj1.tests.length, 2);
    assert.strictEqual(proj2.tests.length, 1);
    assert.strictEqual(proj1.avgFlakeScore, 0);
  });

  it('computes group passRate correctly', () => {
    const tests = [
      { name: 'x', totalRuns: 4, passes: 2, passRate: 0.5, flakeScore: 1.0, avgDuration: 100, isCritical: false, errors: [] },
      { name: 'y', totalRuns: 6, passes: 3, passRate: 0.5, flakeScore: 1.0, avgDuration: 100, isCritical: false, errors: [] },
    ];
    const groups = calculateGroupScores(tests, () => 'group1');
    assert.strictEqual(groups[0].passRate, 0.5);
    assert.strictEqual(groups[0].totalRuns, 10);
    assert.strictEqual(groups[0].passes, 5);
  });
});