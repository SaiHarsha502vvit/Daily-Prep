import { expect, type APIRequestContext, type APIResponse, type TestInfo } from '@playwright/test';
import { AppConstants } from '../../constants/app.constants';

export interface RequestOptions {
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
}

export class APIUtils {
  private readonly request: APIRequestContext;
  private readonly testInfo?: TestInfo;

  constructor(request: APIRequestContext, testInfo?: TestInfo) {
    this.request = request;
    this.testInfo = testInfo;
  }

  private buildUrl(endpoint: string, queryParams?: Record<string, string>): string {
    if (!queryParams || Object.keys(queryParams).length === 0) return endpoint;
    const search = new URLSearchParams(queryParams).toString();
    const separator = endpoint.includes('?') ? '&' : '?';
    return `${endpoint}${separator}${search}`;
  }

  private describeEndpoint(endpoint: string): string {
    const parts = endpoint
      .split('/')
      .filter((p) => p && !p.match(/^v\d+$/))
      .filter((p) => !p.startsWith('http'));

    const isId = (p: string): boolean =>
      /^\d+$/.test(p) ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p) ||
      /^[A-Z]{2,4}\d+$/i.test(p);

    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (part && !isId(part)) {
        const formatted = part
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/[_-]/g, ' ')
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join('');
        const next = parts[i + 1];
        if (next && isId(next) && i === parts.length - 2) {
          return `${formatted} ${next}`;
        }
        return formatted;
      }
    }
    return endpoint;
  }

  private log(method: string, url: string, status: number, ms: number, endpoint: string): void {
    if (!AppConstants.ENABLE_API_TEST_STEPS) return;
    const desc = this.describeEndpoint(endpoint);
    console.log(`\n[${method}] ${desc}`);
    console.log(`  URL:    ${url}`);
    console.log(`  Status: ${status}`);
    console.log(`  Time:   ${ms}ms`);
  }

  async get(
    endpoint: string,
    headers: Record<string, string>,
    expectedStatus: number,
    options: RequestOptions = {}
  ): Promise<APIResponse> {
    const url = this.buildUrl(endpoint, options.queryParams);
    const start = Date.now();
    const response = await this.request.get(url, { headers });
    this.log('GET', url, response.status(), Date.now() - start, endpoint);
    expect(response.status(), `GET ${endpoint} expected ${expectedStatus}`).toBe(expectedStatus);
    return response;
  }

  async post(
    endpoint: string,
    headers: Record<string, string>,
    payload: unknown,
    expectedStatus: number,
    options: RequestOptions = {}
  ): Promise<APIResponse> {
    const url = this.buildUrl(endpoint, options.queryParams);
    const start = Date.now();
    const response = await this.request.post(url, { headers, data: payload });
    this.log('POST', url, response.status(), Date.now() - start, endpoint);
    expect(response.status(), `POST ${endpoint} expected ${expectedStatus}`).toBe(expectedStatus);
    return response;
  }

  async patch(
    endpoint: string,
    headers: Record<string, string>,
    payload: unknown,
    expectedStatus: number
  ): Promise<APIResponse> {
    const start = Date.now();
    const response = await this.request.patch(endpoint, { headers, data: payload });
    this.log('PATCH', endpoint, response.status(), Date.now() - start, endpoint);
    expect(response.status(), `PATCH ${endpoint} expected ${expectedStatus}`).toBe(expectedStatus);
    return response;
  }

  async delete(
    endpoint: string,
    headers: Record<string, string>,
    expectedStatus: number
  ): Promise<APIResponse> {
    const start = Date.now();
    const response = await this.request.delete(endpoint, { headers });
    this.log('DELETE', endpoint, response.status(), Date.now() - start, endpoint);
    expect(response.status(), `DELETE ${endpoint} expected ${expectedStatus}`).toBe(expectedStatus);
    return response;
  }
}
