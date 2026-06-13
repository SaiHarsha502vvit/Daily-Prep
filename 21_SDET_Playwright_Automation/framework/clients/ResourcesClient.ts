import type { APIRequestContext } from '@playwright/test';

import type { ListResourcesResponse, Resource } from '../types/api.types';
import { ApiCore } from '../utilities/api/ApiCore';
import { Endpoints } from '../utilities/api/Endpoints';
import { ValidationError } from '../utilities/api/errors';
import { HeadersBuilder } from '../utilities/api/HeadersBuilder';

/**
 * Layer 5 — Domain client for Resources API.
 *
 * Strongly typed list / get operations against /api/unknown.
 */
export class ResourcesClient {
  private readonly api: ApiCore;

  constructor(request: APIRequestContext) {
    this.api = new ApiCore(request);
  }

  /** GET /api/unknown?page={page} */
  async list(page?: number): Promise<ListResourcesResponse> {
    const endpoint = Endpoints.resources.list(page);
    const headers = HeadersBuilder.new().withJsonDefaults().build();
    const response = await this.api.get<unknown>(endpoint, headers);
    const validated = validateListResourcesResponse(response.data);
    return validated;
  }

  /** GET /api/unknown/{id} */
  async getById(id: number): Promise<Resource> {
    const endpoint = Endpoints.resources.getById(id);
    const headers = HeadersBuilder.new().withJsonDefaults().build();
    const response = await this.api.get<unknown>(endpoint, headers);
    const validated = validateGetResourceResponse(response.data);
    return validated;
  }
}

/* ------------------------------------------------------------------ */
/*  Runtime validators                                                */
/* ------------------------------------------------------------------ */

function validateListResourcesResponse(data: unknown): ListResourcesResponse {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('ListResourcesResponse: expected object', '', data, 'Expected object');
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
        `ListResourcesResponse: data[${idx}] expected object`,
        '',
        item,
        `data[${idx}] not an object`
      );
    }
    const r = item as Record<string, unknown>;
    assertNumber(r, 'id');
    assertString(r, 'name');
    assertNumber(r, 'year');
    assertString(r, 'color');
    assertString(r, 'pantone_value');
  });

  return data as ListResourcesResponse;
}

function validateGetResourceResponse(data: unknown): Resource {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('GetResourceResponse: expected object', '', data, 'Expected object');
  }
  const d = data as Record<string, unknown>;
  assertObject(d, 'data');
  const r = d.data as Record<string, unknown>;

  assertNumber(r, 'id');
  assertString(r, 'name');
  assertNumber(r, 'year');
  assertString(r, 'color');
  assertString(r, 'pantone_value');

  return r as unknown as Resource;
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
