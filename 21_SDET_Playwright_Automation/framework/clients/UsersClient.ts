import type { APIRequestContext } from '@playwright/test';

import { Timeouts, PollIntervals } from '../constants/timeouts';
import type {
  CreateUserRequest,
  CreateUserResponse,
  ListUsersResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  User,
} from '../types/api.types';
import { ApiCore } from '../utilities/api/ApiCore';
import { Endpoints } from '../utilities/api/Endpoints';
import { ValidationError } from '../utilities/api/errors';
import { HeadersBuilder } from '../utilities/api/HeadersBuilder';

/**
 * Layer 5 — Domain client for Users API.
 *
 * Strongly typed CRUD operations against /api/users with
 * response validation and a polling helper for async creation.
 */
export class UsersClient {
  private readonly api: ApiCore;

  constructor(request: APIRequestContext) {
    this.api = new ApiCore(request);
  }

  /** GET /api/users?page={page} */
  async list(page?: number): Promise<ListUsersResponse> {
    const endpoint = Endpoints.users.list(page);
    const headers = HeadersBuilder.new().withJsonDefaults().build();
    const response = await this.api.get<unknown>(endpoint, headers);
    const validated = validateListUsersResponse(response.data);
    return validated;
  }

  /** GET /api/users/{id} */
  async getById(id: number): Promise<User> {
    const endpoint = Endpoints.users.getById(id);
    const headers = HeadersBuilder.new().withJsonDefaults().build();
    const response = await this.api.get<unknown>(endpoint, headers);
    const validated = validateGetUserResponse(response.data);
    return validated;
  }

  /** POST /api/users */
  async create(data: CreateUserRequest): Promise<CreateUserResponse> {
    const endpoint = Endpoints.users.create();
    const headers = HeadersBuilder.new().withJsonDefaults().build();
    const response = await this.api.post<unknown>(endpoint, data, headers);
    const validated = validateCreateUserResponse(response.data);
    return validated;
  }

  /** PUT /api/users/{id} */
  async update(id: number, data: UpdateUserRequest): Promise<UpdateUserResponse> {
    const endpoint = Endpoints.users.update(id);
    const headers = HeadersBuilder.new().withJsonDefaults().build();
    const response = await this.api.put<unknown>(endpoint, data, headers);
    const validated = validateUpdateUserResponse(response.data);
    return validated;
  }

  /** PATCH /api/users/{id} */
  async patch(id: number, data: UpdateUserRequest): Promise<UpdateUserResponse> {
    const endpoint = Endpoints.users.patch(id);
    const headers = HeadersBuilder.new().withJsonDefaults().build();
    const response = await this.api.patch<unknown>(endpoint, data, headers);
    const validated = validateUpdateUserResponse(response.data);
    return validated;
  }

  /** DELETE /api/users/{id} */
  async delete(id: number): Promise<void> {
    const endpoint = Endpoints.users.delete(id);
    const headers = HeadersBuilder.new().withJsonDefaults().build();
    await this.api.delete<unknown>(endpoint, headers);
  }

  /**
   * Poll GET /api/users/{id} until the user is found or timeout.
   *
   * Reqres.in creates users ephemerally, so this is mainly a framework demo.
   *
   * @param id — user id to wait for
   * @param timeoutMs — max time to poll (default 10s)
   */
  async waitForCreated(id: number, timeoutMs: number = Timeouts.TEN_SECONDS): Promise<User> {
    const start = Date.now();
    let lastError: unknown;

    while (Date.now() - start < timeoutMs) {
      try {
        const user = await this.getById(id);
        return user;
      } catch (error) {
        lastError = error;
        await this.sleep(PollIntervals.FAST);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Timeout waiting for user ${id} to appear`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/* ------------------------------------------------------------------ */
/*  Runtime validators                                                */
/* ------------------------------------------------------------------ */

function validateListUsersResponse(data: unknown): ListUsersResponse {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('ListUsersResponse: expected object', '', data, 'Expected object');
  }
  const d = data as Record<string, unknown>;

  assertNumber(d, 'page');
  assertNumber(d, 'per_page');
  assertNumber(d, 'total');
  assertNumber(d, 'total_pages');
  assertArray(d, 'data');

  const dataArr = d.data as unknown[];
  dataArr.forEach((item, idx) => {
    if (typeof item !== 'object' || item === null) {
      throw new ValidationError(
        `ListUsersResponse: data[${idx}] expected object`,
        '',
        item,
        `data[${idx}] not an object`,
      );
    }
    const u = item as Record<string, unknown>;
    assertNumber(u, 'id');
    assertString(u, 'email');
    assertString(u, 'first_name');
    assertString(u, 'last_name');
    assertString(u, 'avatar');
  });

  return data as ListUsersResponse;
}

function validateGetUserResponse(data: unknown): User {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('GetUserResponse: expected object', '', data, 'Expected object');
  }
  const d = data as Record<string, unknown>;
  assertObject(d, 'data');
  const u = d.data as Record<string, unknown>;

  assertNumber(u, 'id');
  assertString(u, 'email');
  assertString(u, 'first_name');
  assertString(u, 'last_name');
  assertString(u, 'avatar');

  return u as unknown as User;
}

function validateCreateUserResponse(data: unknown): CreateUserResponse {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('CreateUserResponse: expected object', '', data, 'Expected object');
  }
  const d = data as Record<string, unknown>;
  assertString(d, 'id');
  assertString(d, 'name');
  assertString(d, 'job');
  assertString(d, 'createdAt');
  return d as unknown as CreateUserResponse;
}

function validateUpdateUserResponse(data: unknown): UpdateUserResponse {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('UpdateUserResponse: expected object', '', data, 'Expected object');
  }
  const d = data as Record<string, unknown>;
  assertString(d, 'name');
  assertString(d, 'job');
  assertString(d, 'updatedAt');
  return d as unknown as UpdateUserResponse;
}

/* ------------------------------------------------------------------ */
/*  Assertion helpers                                                 */
/* ------------------------------------------------------------------ */

function assertNumber(obj: Record<string, unknown>, key: string): void {
  if (typeof obj[key] !== 'number') {
    throw new ValidationError(`Expected ${key} to be number`, '', obj, `${key} not a number`);
  }
}

function assertString(obj: Record<string, unknown>, key: string): void {
  if (typeof obj[key] !== 'string') {
    throw new ValidationError(`Expected ${key} to be string`, '', obj, `${key} not a string`);
  }
}

function assertArray(obj: Record<string, unknown>, key: string): void {
  if (!Array.isArray(obj[key])) {
    throw new ValidationError(`Expected ${key} to be array`, '', obj, `${key} not an array`);
  }
}

function assertObject(obj: Record<string, unknown>, key: string): void {
  if (typeof obj[key] !== 'object' || obj[key] === null) {
    throw new ValidationError(`Expected ${key} to be object`, '', obj, `${key} not an object`);
  }
}
