import type { BridgeKeys } from './bridge-keys';

/**
 * Lightweight in-memory key-value store for passing data between test steps
 * without resorting to `let` variables that scatter data-flow logic throughout the spec.
 *
 * - `get` throws with the key name if the key was never set — no silent undefined.
 * - `snapshot()` returns a plain object suitable for printing in test reports.
 * - `clear()` is called automatically by the fixture teardown.
 */
export class TestDataBridge {
  private readonly store = new Map<string, unknown>();

  set<T>(key: BridgeKeys, value: T): void {
    this.store.set(key, value);
  }

  get<T>(key: BridgeKeys): T {
    if (!this.store.has(key)) {
      throw new Error(`[TestDataBridge] No value stored for key: ${key}`);
    }
    return this.store.get(key) as T;
  }

  has(key: BridgeKeys): boolean {
    return this.store.has(key);
  }

  clear(): void {
    this.store.clear();
  }

  snapshot(): Record<string, unknown> {
    return Object.fromEntries(this.store);
  }
}