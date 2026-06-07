export enum BridgeKeys {
  USER_ID = 'USER_ID',
  ORDER_ID = 'ORDER_ID',
  CITATION_ID = 'CITATION_ID',
  CUSTOMER_ID = 'CUSTOMER_ID',
  AUTH_TOKEN = 'AUTH_TOKEN',
  CREATED_RECORD = 'CREATED_RECORD',
}

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
