/**
 * TestDataBridge — carries scalar values between test steps without globals.
 * Replaces the framework's TestDataBridge for the CH07 solution.
 */
export enum BridgeKey {
  CUSTOMER_ID = 'CUSTOMER_ID',
  ORDER_ID = 'ORDER_ID',
  CUSTOMER_EMAIL = 'CUSTOMER_EMAIL',
  CONFIRMATION_CODE = 'CONFIRMATION_CODE',
}

export class TestDataBridge {
  private readonly store = new Map<BridgeKey, string | number>();

  set(key: BridgeKey, value: string | number): void {
    this.store.set(key, value);
  }

  getNumber(key: BridgeKey): number {
    const val = this.store.get(key);
    if (val === undefined) {
      throw new Error(`[TestDataBridge] No value for key: ${key}`);
    }
    if (typeof val !== 'number') {
      throw new Error(`[TestDataBridge] Expected number for ${key}, got string`);
    }
    return val;
  }

  getString(key: BridgeKey): string {
    const val = this.store.get(key);
    if (val === undefined) {
      throw new Error(`[TestDataBridge] No value for key: ${key}`);
    }
    return String(val);
  }

  clear(): void {
    this.store.clear();
  }
}