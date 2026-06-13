import type { APIRequestContext } from '@playwright/test';
import type {
  ReqresUser,
  ReqresUserListResponse,
  ReqresCreateUserPayload,
  ReqresCreateUserResponse,
} from '../../../types/reqres.types';

/**
 * Layer 5 — Domain client for Reqres.in Users API.
 *
 * Provides strongly-typed CRUD operations against the reqres.in demo API.
 * All endpoints are centralized in the endpoints object to avoid inline string concatenation.
 */
export class UsersClient {
  private readonly baseUrl: string;

  private static readonly endpoints = {
    list: (page: number = 1): string => `/api/users?page=${page}`,
    getById: (id: number): string => `/api/users/${id}`,
    create: (): string => '/api/users',
    update: (id: number): string => `/api/users/${id}`,
    delete: (id: number): string => `/api/users/${id}`,
  } as const;

  constructor(private readonly request: APIRequestContext, baseUrl: string = 'https://reqres.in') {
    this.baseUrl = baseUrl;
  }

  /**
   * GET /api/users?page={page}
   * Lists users with pagination metadata.
   */
  async list(page: number = 1): Promise<ReqresUserListResponse> {
    const url = `${this.baseUrl}${UsersClient.endpoints.list(page)}`;
    const response = await this.request.get(url);

    if (!response.ok()) {
      throw new Error(`UsersClient.list: Expected 200, got ${response.status()} at ${url}`);
    }

    const body = (await response.json()) as ReqresUserListResponse;
    return body;
  }

  /**
   * GET /api/users/{id}
   * Fetches a single user by ID.
   */
  async getById(id: number): Promise<ReqresUser> {
    const url = `${this.baseUrl}${UsersClient.endpoints.getById(id)}`;
    const response = await this.request.get(url);

    if (!response.ok()) {
      throw new Error(`UsersClient.getById: Expected 200, got ${response.status()} at ${url}`);
    }

    const body = (await response.json()) as { data: ReqresUser };
    return body.data;
  }

  /**
   * POST /api/users
   * Creates a new user. reqres.in echoes the payload back with an id and createdAt.
   */
  async create(payload: ReqresCreateUserPayload): Promise<ReqresCreateUserResponse> {
    const url = `${this.baseUrl}${UsersClient.endpoints.create()}`;
    const response = await this.request.post(url, { data: payload });

    if (!response.ok()) {
      throw new Error(`UsersClient.create: Expected 201, got ${response.status()} at ${url}`);
    }

    const body = (await response.json()) as ReqresCreateUserResponse;
    return body;
  }

  /**
   * PUT /api/users/{id}
   * Updates an existing user.
   */
  async update(id: number, payload: ReqresCreateUserPayload): Promise<{ name: string; job: string; updatedAt: string }> {
    const url = `${this.baseUrl}${UsersClient.endpoints.update(id)}`;
    const response = await this.request.put(url, { data: payload });

    if (!response.ok()) {
      throw new Error(`UsersClient.update: Expected 200, got ${response.status()} at ${url}`);
    }

    const body = (await response.json()) as { name: string; job: string; updatedAt: string };
    return body;
  }

  /**
   * DELETE /api/users/{id}
   * Deletes a user.
   */
  async delete(id: number): Promise<void> {
    const url = `${this.baseUrl}${UsersClient.endpoints.delete(id)}`;
    const response = await this.request.delete(url);

    if (!response.ok()) {
      throw new Error(`UsersClient.delete: Expected 204, got ${response.status()} at ${url}`);
    }
  }
}