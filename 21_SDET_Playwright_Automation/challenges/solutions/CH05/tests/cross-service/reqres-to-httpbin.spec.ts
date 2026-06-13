import { test, expect, type APIRequestContext } from '@playwright/test';
import { TestDataBridge } from '../../../utilities/bridge/test-data.bridge';
import { BridgeKeys } from '../../../utilities/bridge/bridge-keys';
import { UsersClient } from '../../../../CH03/applications/reqres-service/api/UsersClient';
import { HttpbinClient } from '../../../applications/httpbin/api/HttpbinClient';
import type { ReqresCreateUserPayload } from '../../../../CH03/types/reqres.types';

/**
 * Generate unique user data for test isolation between parallel workers.
 */
function uniquePayload(prefix = 'BridgeUser'): ReqresCreateUserPayload {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return { name: `${prefix}-${ts}-${rand}`, job: `Engineer-${rand}` };
}

/**
 * Fixture that injects a fresh TestDataBridge per test and auto-clears it after.
 * This replaces `let` variables that would otherwise scatter data flow across the spec.
 */
const bridgeFixture = async ({}, use: (bridge: TestDataBridge) => Promise<void>) => {
  const bridge = new TestDataBridge();
  await use(bridge);
  bridge.clear();
};

test.describe('Cross-Service Data Bridge', { tag: ['@e2e', '@bridge'] }, () => {
  test('data flows from reqres.in creation through bridge to httpbin echo', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const bridge = new TestDataBridge();

    // ── Step 1: Create user via reqres.in ──────────────────────────────────────
    await test.step('Create user via reqres', async () => {
      const client = new UsersClient(request);
      const payload = uniquePayload('ReqresToHttpbin');

      const response = await client.create(payload);

      // Store both values in the bridge — no `let` variables
      bridge.set(BridgeKeys.USER_ID, response.id);
      bridge.set(BridgeKeys.USER_NAME, response.name);

      // Snapshot in report for traceability
      console.log('[Bridge snapshot]', JSON.stringify(bridge.snapshot()));

      expect(response).toMatchObject({
        id: expect.any(String),
        name: payload.name,
        job: payload.job,
        createdAt: expect.any(String),
      });
    });

    // ── Step 2: Verify bridge holds both values ───────────────────────────────
    await test.step('Bridge stores values', async () => {
      expect(bridge.has(BridgeKeys.USER_ID)).toBe(true);
      expect(bridge.has(BridgeKeys.USER_NAME)).toBe(true);

      const storedId = bridge.get<string>(BridgeKeys.USER_ID);
      const storedName = bridge.get<string>(BridgeKeys.USER_NAME);

      expect(storedId).toBeTruthy();
      expect(storedName).toBeTruthy();

      // Snapshot confirms both keys are present in the report
      console.log('[Bridge snapshot]', JSON.stringify(bridge.snapshot()));
    });

    // ── Step 3: Echo via httpbin and assert equality ──────────────────────────
    await test.step('Echo via httpbin asserts equality', async () => {
      const httpbin = new HttpbinClient(request);

      const userId = bridge.get<string>(BridgeKeys.USER_ID);
      const userName = bridge.get<string>(BridgeKeys.USER_NAME);

      const echo = await httpbin.postAnything({ id: userId, name: userName });

      expect(echo.json).toMatchObject({
        id: userId,
        name: userName,
      });

      // Final snapshot in report
      console.log('[Bridge snapshot]', JSON.stringify(bridge.snapshot()));
    });

    // Teardown — clear the bridge now that the test is done
    bridge.clear();
  });
});