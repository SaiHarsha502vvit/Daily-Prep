import type { APIRequestContext, APIResponse as PlaywrightAPIResponse } from '@playwright/test';

import { AppConstants } from '../../constants/app.constants';
import { Timeouts } from '../../constants/timeouts';

import { ApiError, createStatusError, NetworkError } from './errors';
import { getApiTracer, createApiSpan, propagation } from './telemetry';

export interface ApiClientResponse<T> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiCoreOptions {
  /** Max number of retries after the first attempt. Default: 3. */
  maxRetries?: number;
  /** Default timeout per request in ms. Default: 30000. */
  defaultTimeoutMs?: number;
}

/**
 * Layer 2 — Generic wrapper around Playwright's APIRequestContext.
 *
 * Provides typed GET/POST/PUT/PATCH/DELETE, exponential-backoff retry with jitter,
 * request/response logging, and a typed error taxonomy.
 */
export class ApiCore {
  private readonly request: APIRequestContext;
  private readonly maxRetries: number;
  private readonly defaultTimeoutMs: number;
  private readonly tracer = getApiTracer();

  constructor(request: APIRequestContext, options: ApiCoreOptions = {}) {
    this.request = request;
    this.maxRetries = options.maxRetries ?? 3;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? Timeouts.THIRTY_SECONDS;
  }

  /** Performs a typed GET request. */
  async get<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiClientResponse<T>> {
    return this.executeWithRetry<T>('GET', endpoint, { headers });
  }

  /** Performs a typed POST request. */
  async post<T>(
    endpoint: string,
    payload: unknown,
    headers?: Record<string, string>
  ): Promise<ApiClientResponse<T>> {
    return this.executeWithRetry<T>('POST', endpoint, { headers, payload });
  }

  /** Performs a typed PUT request. */
  async put<T>(
    endpoint: string,
    payload: unknown,
    headers?: Record<string, string>
  ): Promise<ApiClientResponse<T>> {
    return this.executeWithRetry<T>('PUT', endpoint, { headers, payload });
  }

  /** Performs a typed PATCH request. */
  async patch<T>(
    endpoint: string,
    payload: unknown,
    headers?: Record<string, string>
  ): Promise<ApiClientResponse<T>> {
    return this.executeWithRetry<T>('PATCH', endpoint, { headers, payload });
  }

  /** Performs a typed DELETE request. */
  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiClientResponse<T>> {
    return this.executeWithRetry<T>('DELETE', endpoint, { headers });
  }

  /* ------------------------------------------------------------------ */
  /*  Internal execution                                                */
  /* ------------------------------------------------------------------ */

  private async executeWithRetry<T>(
    method: HttpMethod,
    endpoint: string,
    options: {
      headers?: Record<string, string>;
      payload?: unknown;
    }
  ): Promise<ApiClientResponse<T>> {
    let lastError: unknown;
    const attempts = this.maxRetries + 1;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await this.executeOnce<T>(method, endpoint, options);
      } catch (error) {
        lastError = error;
        const isLast = attempt === attempts;

        if (!isLast && this.isRetryable(error)) {
          const delay = this.calculateBackoff(attempt);
          this.logRetry(method, endpoint, attempt, delay, error);
          await this.sleep(delay);
          // continue to next attempt
        } else {
          throw error;
        }
      }
    }

    // Should never reach here because the loop either returns or throws.
    throw lastError instanceof Error
      ? lastError
      : new Error(`Unexpected retry exhaustion for ${method} ${endpoint}`);
  }

  private async executeOnce<T>(
    method: HttpMethod,
    endpoint: string,
    options: {
      headers?: Record<string, string>;
      payload?: unknown;
    }
  ): Promise<ApiClientResponse<T>> {
    const span = createApiSpan(this.tracer, `http.${method.toLowerCase()}`, {
      'http.method': method,
      'http.url': endpoint,
      'http.target': endpoint,
    });

    const mergedHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...options.headers,
    };

    // Propagate trace context so downstream services can correlate spans
    propagation.inject(mergedHeaders);

    let pwResponse: PlaywrightAPIResponse;
    const start = Date.now();

    try {
      const requestOptions = {
        headers: mergedHeaders,
        timeout: this.defaultTimeoutMs,
        data: options.payload,
      };

      switch (method) {
        case 'GET':
          pwResponse = await this.request.get(endpoint, { headers: mergedHeaders, timeout: this.defaultTimeoutMs });
          break;
        case 'POST':
          pwResponse = await this.request.post(endpoint, requestOptions);
          break;
        case 'PUT':
          pwResponse = await this.request.put(endpoint, requestOptions);
          break;
        case 'PATCH':
          pwResponse = await this.request.patch(endpoint, requestOptions);
          break;
        case 'DELETE':
          pwResponse = await this.request.delete(endpoint, { headers: mergedHeaders, timeout: this.defaultTimeoutMs });
          break;
        default:
          // Exhaustive check — this branch is unreachable at runtime for valid HttpMethod values
          ((_: never) => _)(method);
          throw new Error(`Unsupported HTTP method: ${String(method)}`);
      }

      span.setAttribute('http.status_code', pwResponse.status());
    } catch (networkErr) {
      span.recordException(networkErr instanceof Error ? networkErr : new Error(String(networkErr)));
      span.setAttribute('error', true);
      const errMsg = networkErr instanceof Error ? networkErr.message : String(networkErr);
      throw new NetworkError(errMsg, endpoint, networkErr instanceof Error ? networkErr : new Error(errMsg));
    } finally {
      span.end();
    }

    const status = pwResponse.status();
    const duration = Date.now() - start;
    this.log(method, endpoint, status, duration, mergedHeaders);

    // For 204 No Content we return empty data
    if (status === AppConstants.HTTP_NO_CONTENT) {
      return {
        status,
        data: undefined as unknown as T,
        headers: pwResponse.headers(),
      };
    }

    let body: unknown;
    try {
      body = await pwResponse.json();
    } catch {
      body = await pwResponse.text();
    }

    // Throw typed errors for non-success codes
    if (status < AppConstants.HTTP_OK || status >= 300) {
      const message = typeof body === 'object' && body !== null && 'error' in body
        ? String((body as Record<string, unknown>).error)
        : `HTTP ${status}`;
      throw createStatusError(status, message, endpoint, body);
    }

    return {
      status,
      data: body as T,
      headers: pwResponse.headers(),
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Retry helpers                                                     */
  /* ------------------------------------------------------------------ */

  private isRetryable(error: unknown): boolean {
    if (error instanceof NetworkError) return true;
    if (error instanceof ApiError) {
      const status = error.status;
      // Retry on rate-limit or server errors
      if (status === AppConstants.HTTP_TOO_MANY_REQUESTS) return true;
      if (status >= AppConstants.HTTP_INTERNAL_SERVER_ERROR) return true;
    }
    return false;
  }

  /** Exponential backoff with jitter: 2^attempt * 1000ms + random(0-1000ms). Capped at 30s. */
  private calculateBackoff(attempt: number): number {
    const base = Math.pow(2, attempt) * 1000;
    const jitter = Math.random() * 1000;
    return Math.min(base + jitter, Timeouts.THIRTY_SECONDS);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* ------------------------------------------------------------------ */
  /*  Logging                                                           */
  /* ------------------------------------------------------------------ */

  private log(
    method: string,
    endpoint: string,
    status: number,
    ms: number,
    _headers: Record<string, string>
  ): void {
    // Unused `headers` parameter suffix prevents noUnusedParameters lint while keeping signature extensible
    void _headers;
    const ts = new Date().toISOString();
    const indicator = status < 300 ? 'OK' : status < 400 ? 'REDIR' : 'ERR';
    console.log(`[${ts}] [API] ${method.padEnd(6)} ${indicator} ${status} | ${ms}ms | ${endpoint}`);
  }

  private logRetry(
    method: string,
    endpoint: string,
    attempt: number,
    delayMs: number,
    error: unknown
  ): void {
    const ts = new Date().toISOString();
    const errorName = error instanceof Error ? error.name : 'Error';
    console.log(
      `[${ts}] [API] RETRY  attempt=${attempt} delay=${Math.round(delayMs)}ms reason=${errorName} | ${method} ${endpoint}`
    );
  }
}
