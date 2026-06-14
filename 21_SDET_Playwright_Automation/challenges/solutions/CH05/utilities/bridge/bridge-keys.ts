/**
 * Typed keys for the cross-service test data bridge.
 * Using an enum ensures compile-time correctness — no raw string keys in get/set calls.
 */
export enum BridgeKeys {
  USER_ID = "USER_ID",
  USER_NAME = "USER_NAME",
}
