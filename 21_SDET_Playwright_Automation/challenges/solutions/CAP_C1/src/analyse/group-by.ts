import { TestSummary } from "./flake-score";

/**
 * Normalize an error message for clustering — strip dynamic values.
 */
export function normalizeErrorPattern(error: string): string {
  // Remove timestamps, UUIDs, and numeric IDs
  return error
    .replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/g, "<TIMESTAMP>")
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      "<UUID>",
    )
    .replace(/\b\d+\b/g, "<N>")
    .replace(/locator\(\)[^)]*\)/g, "locator(<SELECTOR>)")
    .replace(/\/.*?\.(spec|test)\.ts:?\\?\d*/g, "<FILE>")
    .trim();
}

/**
 * Extract a representative error from a test's errors array.
 */
function representativeError(errors: string[]): string {
  if (errors.length === 0) return "no error";
  return normalizeErrorPattern(errors[0]);
}

/**
 * Cluster tests by normalized error message pattern.
 */
export function groupByErrorMessage(tests: TestSummary[]): TestSummary[][] {
  const groups = new Map<string, TestSummary[]>();

  for (const test of tests) {
    const err = representativeError(test.errors ?? []);
    const key = err.length > 200 ? err.slice(0, 200) + "..." : err;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(test);
  }

  return Array.from(groups.values());
}

/**
 * Group tests by spec file path (everything before the last '/' or '\\').
 */
export function groupByFile(tests: TestSummary[]): TestSummary[][] {
  const groups = new Map<string, TestSummary[]>();

  for (const test of tests) {
    // Extract file path from test name: "test file name [tag]" or just use name
    const match = test.name.match(/^.*[/\\]([^/\\]+)\.(spec|test)\.[tj]s/);
    const file = match ? match[0] : "unknown";
    if (!groups.has(file)) groups.set(file, []);
    groups.get(file)!.push(test);
  }

  return Array.from(groups.values());
}

/**
 * Group tests by project name — extracted from test name brackets.
 * e.g. "my test [project-name]" -> "project-name"
 */
export function groupByProject(tests: TestSummary[]): TestSummary[][] {
  const groups = new Map<string, TestSummary[]>();

  for (const test of tests) {
    const match = test.name.match(/\[([^\]]+)\]$/);
    const project = match ? match[1] : "default";
    if (!groups.has(project)) groups.set(project, []);
    groups.get(project)!.push(test);
  }

  return Array.from(groups.values());
}
