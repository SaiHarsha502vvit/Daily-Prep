import * as fs from 'fs';
import * as path from 'path';

const TEST_DATA_ROOT = path.resolve(__dirname, '..', '..', 'test-data');

export function loadTestData<T>(relativePath: string): T {
  const fullPath = path.join(TEST_DATA_ROOT, `${relativePath}.json`);
  if (!fs.existsSync(fullPath)) {
    throw new Error(
      `[data.loader] Test data not found: ${fullPath}\n` +
        `→ Pass a path relative to test-data/, without .json extension.`
    );
  }
  const raw = fs.readFileSync(fullPath, 'utf-8');
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new Error(`[data.loader] Invalid JSON in ${fullPath}: ${(err as Error).message}`);
  }
}

export function uniqueEmail(prefix = 'test'): string {
  return `${prefix}+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export function uniqueId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
