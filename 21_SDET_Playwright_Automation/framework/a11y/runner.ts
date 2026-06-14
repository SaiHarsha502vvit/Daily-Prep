import type * as AxeCorePlaywright from '@axe-core/playwright';
import type { Page } from '@playwright/test';
// Type-only namespace import — the runtime side-effect happens inside
// runAxe() via dynamic `await import(...)`, so the module degrades gracefully
// when @axe-core/playwright is absent.

/**
 * Axe results type - subset of axe-core Result type for violation reporting.
 */
export interface AxeResults {
  violations: AxeViolation[];
  passes: AxeViolation[];
  timestamp: string;
  url: string;
}

export interface AxeViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: AxeNode[];
}

export interface AxeNode {
  html: string;
  target: string[];
  any: unknown[];
  all: unknown[];
  none: unknown[];
}

/**
 * Runs axe-core accessibility scan on the given page.
 * Uses dynamic import to gracefully handle missing @axe-core/playwright.
 *
 * @param page - Playwright page to scan
 * @param options - Optional axe options (e.g., { tags: ['wcag2a'] })
 * @returns AxeResults containing violations and passes
 * @throws Error if @axe-core/playwright is not installed
 */
export async function runAxe(page: Page, options?: { tags?: string[] }): Promise<AxeResults> {
  let axePlaywright: typeof AxeCorePlaywright | null = null;

  try {
    axePlaywright = await import('@axe-core/playwright');
  } catch {
    throw new Error(
      '@axe-core/playwright is not installed. Install it with:\n' +
        '  npm install @axe-core/playwright --save-dev\n' +
        'Then re-run your tests.',
    );
  }

  const AxeBuilder = axePlaywright.default;
  let builder = new AxeBuilder({ page });
  if (options?.tags && options.tags.length > 0) {
    builder = builder.withTags(options.tags);
  }
  const accessibilityScanResults = await builder.analyze();
  return accessibilityScanResults as unknown as AxeResults;
}

/**
 * Asserts that there are no accessibility violations.
 * Throws a detailed error message listing all violations found.
 *
 * @param results - AxeResults from runAxe()
 * @throws Error with detailed violation report if any violations exist
 */
export function assertNoViolations(results: AxeResults): void {
  if (results.violations.length === 0) {
    return;
  }

  const violationSummary = results.violations
    .map(
      (v) =>
        `- [${v.impact ?? 'unknown'}] ${v.id}: ${v.description}\n` +
        v.nodes.map((n) => `    Target: ${n.target.join(', ')}\n    HTML: ${n.html}`).join('\n'),
    )
    .join('\n\n');

  throw new Error(
    `Found ${results.violations.length} accessibility violation(s):\n\n${violationSummary}\n\n` +
      'See helpUrl for more details on each issue.',
  );
}
