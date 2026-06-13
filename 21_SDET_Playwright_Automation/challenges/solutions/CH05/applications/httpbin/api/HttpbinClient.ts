import type { APIRequestContext } from '@playwright/test';

export interface HttpbinAnythingResponse {
  args: Record<string, unknown>;
  data: string;
  files: Record<string, unknown>;
  form: Record<string, unknown>;
  headers: Record<string, string>;
  json: unknown;
  origin: string;
  url: string;
}

export interface HttpbinPostResponse extends HttpbinAnythingResponse {
  json: {
    id?: string | number;
    name?: string;
  };
}

/**
 * Typed API client for httpbin.org — a public echo service ideal for test plumbing.
 * https://httpbin.org/anything echoes back whatever JSON you POST, making it useful
 * for validating that data produced in one service can be consumed by another.
 */
export class HttpbinClient {
  private static readonly BASE_URL = 'https://httpbin.org';
  private static readonly endpoints = {
    anything: (): string => '/anything',
  } as const;

  constructor(private readonly request: APIRequestContext) {}

  /**
   * POST /anything — echoes the request body back as JSON.
   * Use to verify a payload arrived intact across service boundaries.
   */
  async postAnything<T = unknown>(body: T): Promise<HttpbinPostResponse> {
    const url = `${HttpbinClient.BASE_URL}${HttpbinClient.endpoints.anything()}`;
    const response = await this.request.post(url, { data: body });

    if (!response.ok()) {
      throw new Error(`HttpbinClient.postAnything: Expected 200, got ${response.status()} at ${url}`);
    }

    return (await response.json()) as HttpbinPostResponse;
  }
}