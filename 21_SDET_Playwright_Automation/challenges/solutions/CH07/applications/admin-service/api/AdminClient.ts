/**
 * AdminService API Client — simulates admin portal API interactions.
 *
 * In production this would call a real admin backend.
 * Here we use reqres.in as a mock:
 *   - POST /api/users  → "create customer account"
 *   - DELETE /api/users/{id} → "delete customer account"
 *
 * This client is used by both the admin context and the test cleanup step.
 */
import type { APIRequestContext } from '@playwright/test';
import { endpoints } from '../../../constants/endpoints';
import { APP } from '../../../constants/app.constants';
import type {
  Customer,
  CreateCustomerPayload,
  CreateCustomerResponse,
} from '../../../types/cross-site.types';

export class AdminClient {
  private readonly baseUrl: string;

  constructor(
    private readonly request: APIRequestContext,
    baseUrl: string = APP.reqres.baseUrl
  ) {
    this.baseUrl = baseUrl;
  }

  /**
   * POST /api/users
   * Creates a customer account in the system.
   * In the real flow this corresponds to "admin creates customer via UI/API".
   */
  async createCustomer(payload: CreateCustomerPayload): Promise<CreateCustomerResponse> {
    const url = `${this.baseUrl}${endpoints.reqres.CREATE_USER}`;
    const response = await this.request.post(url, { data: payload });

    if (!response.ok()) {
      throw new Error(
        `AdminClient.createCustomer: Expected 201, got ${response.status()} at ${url}`
      );
    }

    const body = (await response.json()) as CreateCustomerResponse;
    return body;
  }

  /**
   * GET /api/users/{id}
   * Fetches a customer by ID to confirm creation.
   */
  async getCustomer(id: number): Promise<Customer> {
    const url = `${this.baseUrl}${endpoints.reqres.USER_BY_ID(id)}`;
    const response = await this.request.get(url);

    if (!response.ok()) {
      throw new Error(`AdminClient.getCustomer: Expected 200, got ${response.status()} at ${url}`);
    }

    const body = (await response.json()) as { data: Customer };
    return body.data;
  }

  /**
   * DELETE /api/users/{id}
   * Deletes a customer account (cleanup).
   */
  async deleteCustomer(id: number): Promise<void> {
    const url = `${this.baseUrl}${endpoints.reqres.USER_BY_ID(id)}`;
    const response = await this.request.delete(url);

    if (!response.ok()) {
      throw new Error(
        `AdminClient.deleteCustomer: Expected 204, got ${response.status()} at ${url}`
      );
    }
  }

  /**
   * PATCH /api/users/{id} — update customer metadata (used to tag as "customer" in reqres)
   */
  async updateCustomer(
    id: number,
    payload: Partial<CreateCustomerPayload>
  ): Promise<{ updatedAt: string }> {
    const url = `${this.baseUrl}${endpoints.reqres.USER_BY_ID(id)}`;
    const response = await this.request.patch(url, { data: payload });

    if (!response.ok()) {
      throw new Error(
        `AdminClient.updateCustomer: Expected 200, got ${response.status()} at ${url}`
      );
    }

    return (await response.json()) as { updatedAt: string };
  }
}