import { test, expect, type APIRequestContext } from "@playwright/test";
import { UsersClient } from "../../../applications/reqres-service/api/UsersClient";
import type { ReqresCreateUserPayload } from "../../types/reqres.types";

/**
 * Generate a unique name + job for test isolation.
 * Uses timestamp + random suffix to avoid collisions between test runs.
 */
function generateUniqueData(prefix = "TestUser"): {
  name: string;
  job: string;
} {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return {
    name: `${prefix}-${timestamp}-${randomSuffix}`,
    job: `Engineer-${randomSuffix}`,
  };
}

test.describe("Users API Cross-Validation", { tag: ["@e2e", "@api"] }, () => {
  /**
   * POST /api/users → assert id, createdAt, echoed name/job.
   * Reqres.in is a mock; created users won't appear in list, but we still validate shape.
   */
  test("create user and validate response shape", async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const client = new UsersClient(request);
    const payload: ReqresCreateUserPayload = generateUniqueData("CreateTest");

    const createResponse = await client.create(payload);

    // Shape assertion — not just status!
    expect(createResponse).toMatchObject({
      id: expect.any(String),
      name: payload.name,
      job: payload.job,
      createdAt: expect.any(String),
    });

    // Verify id is non-empty and createdAt is a valid ISO timestamp
    expect(createResponse.id.length).toBeGreaterThan(0);
    expect(new Date(createResponse.createdAt).toISOString()).toBe(
      createResponse.createdAt,
    );
  });

  /**
   * GET /api/users?page=1 → assert pagination fields and data[] item shape.
   */
  test("list users and validate response shape", async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const client = new UsersClient(request);

    const listResponse = await client.list(1);

    // Partial shape via toMatchObject
    expect(listResponse).toMatchObject({
      page: expect.any(Number),
      per_page: expect.any(Number),
      total: expect.any(Number),
      total_pages: expect.any(Number),
      data: expect.any(Array),
    });

    // Semantic validation of pagination values
    expect(listResponse.page).toBeGreaterThanOrEqual(1);
    expect(listResponse.per_page).toBeGreaterThan(0);
    expect(listResponse.total_pages).toBeGreaterThan(0);

    // Validate data[] item shape when array is non-empty
    if (listResponse.data.length > 0) {
      expect(listResponse.data[0]).toMatchObject({
        id: expect.any(Number),
        email: expect.any(String),
        first_name: expect.any(String),
        last_name: expect.any(String),
        avatar: expect.any(String),
      });
    }
  });

  /**
   * GET /api/users/{id} → assert single user shape matches data[] item shape.
   */
  test("get user by id and validate response shape", async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const client = new UsersClient(request);

    // Seed: grab a known ID from the list
    const listResponse = await client.list(1);
    expect(listResponse.data.length).toBeGreaterThan(0);
    const knownId = listResponse.data[0].id;

    const user = await client.getById(knownId);

    expect(user).toMatchObject({
      id: expect.any(Number),
      email: expect.any(String),
      first_name: expect.any(String),
      last_name: expect.any(String),
      avatar: expect.any(String),
    });

    expect(user.id).toBe(knownId);
  });

  /**
   * Full flow: create → list (mock limitation: user won't appear, but shape validates correctly).
   */
  test("create then list — validate shape across calls", async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const client = new UsersClient(request);
    const payload: ReqresCreateUserPayload = generateUniqueData("FlowTest");

    const createResponse = await client.create(payload);
    expect(createResponse.name).toBe(payload.name);
    expect(createResponse.job).toBe(payload.job);

    const listResponse = await client.list(1);

    // Always validate shape — even on mock APIs
    expect(listResponse).toMatchObject({
      page: expect.any(Number),
      per_page: expect.any(Number),
      data: expect.any(Array),
    });

    // reqres.in is a mock: created users don't persist in list
    const createdInList = listResponse.data.find(
      (u) => u.first_name === payload.name || u.last_name === payload.name,
    );
    expect(createdInList).toBeUndefined(); // documents mock behavior
  });
});
